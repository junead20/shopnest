// server/routes/groupCart.js
const express = require('express');
const router = express.Router();
const GroupCart = require('../models/GroupCart');
const Order = require('../models/Order');
const { authMiddleware } = require('../middleware/auth');

router.use((req, res, next) => {
    console.log(`📡 GroupCart Router: ${req.method} ${req.url}`);
    next();
});

/**
 * @route   PUT /api/group-cart/unlock
 * @desc    Unlock the cart (Admin only)
 */
router.put('/unlock', authMiddleware, async (req, res) => {
    try {
        const { token } = req.body;
        const group = await GroupCart.findOne({ shareToken: token });
        
        if (!group) {
            return res.status(404).json({ message: 'Group session not found. Please refresh.' });
        }
        
        if (group.admin.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Only the group admin can unlock this cart.' });
        }

        group.status = 'active';
        await group.save();

        try {
            const io = req.app.get('io');
            if (io) {
                io.to(token).emit('cartUpdated', { 
                    type: 'cartUnlocked',
                    user: req.user.name 
                });
            }
        } catch (socketError) {
            console.warn('⚠️ Webhook/Socket failed in unlock:', socketError.message);
        }

        res.json(group);
    } catch (error) {
        console.error('Err Unlocking:', error);
        res.status(500).json({ message: 'Server error while unlocking cart', details: error.message });
    }
});

/**
 * @route   POST /api/group-cart/create
 * @desc    Initialize a group shopping session
 */
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        const newGroup = new GroupCart({
            name,
            admin: req.user.id,
            members: [{ user: req.user.id }]
        });
        const savedGroup = await newGroup.save();
        
        // Notify room (though others can't be there yet, good for consistency)
        try {
            const io = req.app.get('io');
            if (io) io.to(savedGroup.shareToken).emit('cartUpdated', { type: 'created', group: savedGroup });
        } catch (e) {
            console.warn('Socket error in group creation:', e.message);
        }

        res.status(201).json(savedGroup);
    } catch (error) {
        console.error('Group creation error:', error);
        res.status(500).json({ message: 'Error creating group cart', error: error.message });
    }
});

/**
 * @route   GET /api/group-cart/:token
 * @desc    Get group cart details by share token
 */
router.get('/:token', authMiddleware, async (req, res) => {
    try {
        const group = await GroupCart.findOne({ shareToken: req.params.token })
            .populate('admin', 'name email')
            .populate('members.user', 'name email')
            .populate('items.product')
            .populate('items.addedBy', 'name')
            .populate('items.votes.user', 'name');

        if (!group) return res.status(404).json({ message: 'Group not found' });
        
        // Filter out members whose user was deleted (populated as null)
        if (group.members) {
            group.members = group.members.filter(m => m.user !== null);
        }

        // Filter out votes and items from deleted users
        if (group.items) {
            group.items.forEach(item => {
                if (item.votes) {
                    item.votes = item.votes.filter(v => v.user !== null);
                }
            });
            // We keep the items even if addedBy is null, but we'll show "Unknown" in frontend
        }
        
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching group cart' });
    }
});

/**
 * @route   GET /api/group-cart/user/my-groups
 * @desc    Get all groups for the current user
 */
router.get('/user/my-groups', authMiddleware, async (req, res) => {
    try {
        const groups = await GroupCart.find({
            'members.user': req.user.id
        }).sort({ updatedAt: -1 }).limit(10);
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user groups' });
    }
});

/**
 * @route   POST /api/group-cart/join/:token
 * @desc    Join a group cart session
 */
router.post('/join/:token', authMiddleware, async (req, res) => {
    try {
        const group = await GroupCart.findOne({ shareToken: req.params.token });
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const isMember = group.members.some(m => m.user.toString() === req.user.id);
        if (!isMember) {
            group.members.push({ user: req.user.id });
            
            // Apply team discount if members >= 3
            if (group.members.length >= 3) {
                group.discountAmount = 7;
            }
            
            await group.save();

            try {
                const io = req.app.get('io');
                if (io) io.to(req.params.token).emit('cartUpdated', { type: 'memberJoined', user: req.user.name });
            } catch (e) {
                console.warn('Socket error in join:', e.message);
            }
        }
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: 'Error joining group' });
    }
});

/**
 * @route   PUT /api/group-cart/add-item
 * @desc    Add item to shared cart
 */
router.put('/add-item', authMiddleware, async (req, res) => {
    try {
        const { token, productId, quantity } = req.body;
        const group = await GroupCart.findOne({ shareToken: token });
        if (!group) return res.status(404).json({ message: 'Group not found' });

        // Check if item already exists
        const itemIndex = group.items.findIndex(i => i.product.toString() === productId);
        if (itemIndex > -1) {
            group.items[itemIndex].quantity += (quantity || 1);
        } else {
            group.items.push({
                product: productId,
                quantity: quantity || 1,
                addedBy: req.user.id
            });
        }

        await group.save();

        try {
            const io = req.app.get('io');
            if (io) io.to(token).emit('cartUpdated', { type: 'itemAdded', productId });
        } catch (e) {
            console.warn('Socket error in add-item:', e.message);
        }

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: 'Error adding item' });
    }
});

/**
 * @route   PUT /api/group-cart/vote
 * @desc    Vote on an item in the group cart
 */
router.put('/vote', authMiddleware, async (req, res) => {
    try {
        const { token, productId, vote } = req.body; // vote: 'up' or 'down'
        const group = await GroupCart.findOne({ shareToken: token });
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const item = group.items.find(i => i.product.toString() === productId);
        if (!item) return res.status(404).json({ message: 'Item not found in cart' });

        // Remove previous vote by this user if exists
        item.votes = item.votes.filter(v => v.user.toString() !== req.user.id);
        item.votes.push({ user: req.user.id, vote });

        await group.save();

        try {
            const io = req.app.get('io');
            if (io) io.to(token).emit('cartUpdated', { type: 'voteCast', productId, userId: req.user.id });
        } catch (e) {
            console.warn('Socket error in vote:', e.message);
        }

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: 'Error voting' });
    }
});

/**
 * @route   PUT /api/group-cart/lock
 * @desc    Lock the cart for checkout (Admin only)
 */
router.put('/lock', authMiddleware, async (req, res) => {
    try {
        const { token } = req.body;
        const group = await GroupCart.findOne({ shareToken: token });
        if (!group) return res.status(404).json({ message: 'Group not found' });
        
        if (group.admin.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Only the group admin can lock the cart' });
        }

        group.status = 'locked';
        await group.save();

        const io = req.app.get('io');
        io.to(token).emit('cartUpdated', { type: 'cartLocked' });

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: 'Error locking cart' });
    }
});


/**
 * @route   POST /api/group-cart/place-order
 * @desc    Place order for the locked group cart
 */
router.post('/place-order', authMiddleware, async (req, res) => {
    try {
        const { token, shippingAddress, paymentMethod } = req.body;
        const group = await GroupCart.findOne({ shareToken: token }).populate('items.product');
        
        if (!group) return res.status(404).json({ message: 'Group not found' });
        if (group.admin.toString() !== req.user.id) return res.status(403).json({ message: 'Only admin can place order' });
        if (group.status !== 'locked') return res.status(400).json({ message: 'Cart must be locked before ordering' });

        const orderItems = group.items.map(item => ({
            name: item.product.name,
            qty: item.quantity,
            image: item.product.imageUrl,
            price: item.product.price,
            product: item.product._id
        }));

        const itemsPrice = orderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
        const discountAmount = (itemsPrice * (group.discountAmount || 0)) / 100;
        const discountedItemsPrice = itemsPrice - discountAmount;
        
        const taxPrice = Number((0.18 * discountedItemsPrice).toFixed(2));
        const shippingPrice = discountedItemsPrice > 500 ? 0 : 40;
        const totalPrice = discountedItemsPrice + taxPrice + shippingPrice;

        const newOrder = new Order({
            user: req.user.id,
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice: discountedItemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            isPaid: paymentMethod !== 'Cash on Delivery',
            paidAt: paymentMethod !== 'Cash on Delivery' ? new Date() : null,
            notes: [{ text: `Group Order: ${group.name}`, addedBy: req.user.id }]
        });

        const savedOrder = await newOrder.save();
        
        group.status = 'ordered';
        await group.save();

        const io = req.app.get('io');
        io.to(token).emit('cartUpdated', { type: 'orderPlaced', orderId: savedOrder._id });

        res.status(201).json(savedOrder);
    } catch (error) {
        console.error('Error placing group order:', error);
        res.status(500).json({ message: 'Error placing group order' });
    }
});

/**
 * @route   PUT /api/group-cart/ready
 * @desc    Toggle ready status for a member
 */
router.put('/ready', authMiddleware, async (req, res) => {
    try {
        const { token } = req.body;
        const group = await GroupCart.findOne({ shareToken: token });
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const member = group.members.find(m => m.user.toString() === req.user.id);
        if (!member) return res.status(403).json({ message: 'Not a member' });

        member.ready = !member.ready;
        await group.save();

        const io = req.app.get('io');
        io.to(token).emit('cartUpdated', { type: 'readyToggled', userId: req.user.id, ready: member.ready });

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: 'Error updating ready status' });
    }
});

/**
 * @route   DELETE /api/group-cart/:token
 * @desc    Delete the entire group cart (Admin only)
 */
router.delete('/:token', authMiddleware, async (req, res) => {
    try {
        const group = await GroupCart.findOne({ shareToken: req.params.token });
        if (!group) return res.status(404).json({ message: 'Group not found' });
        
        if (group.admin.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only the admin can delete the group' });
        }

        await GroupCart.deleteOne({ _id: group._id });
        
        const io = req.app.get('io');
        if(io) io.to(req.params.token).emit('cartUpdated', { type: 'deleted' });

        res.json({ message: 'Group deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting group cart' });
    }
});

/**
 * @route   PUT /api/group-cart/leave/:token
 * @desc    Leave a group cart (Members only)
 */
router.put('/leave/:token', authMiddleware, async (req, res) => {
    try {
        const group = await GroupCart.findOne({ shareToken: req.params.token });
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (group.admin.toString() === req.user.id) {
            return res.status(400).json({ message: 'Admin cannot leave the group. Delete it instead or transfer admin rights.' });
        }

        const initialLength = group.members.length;
        group.members = group.members.filter(m => m.user.toString() !== req.user.id);

        if (group.members.length === initialLength) {
            return res.status(400).json({ message: 'You are not a member of this group.' });
        }

        // Remove votes of the leaving user
        group.items.forEach(item => {
            item.votes = item.votes.filter(v => v.user.toString() !== req.user.id);
        });

        // Recalculate team discount
        if (group.members.length < 3) {
            group.discountAmount = 0;
        }

        await group.save();

        const io = req.app.get('io');
        if(io) io.to(req.params.token).emit('cartUpdated', { type: 'memberLeft', user: req.user.name });

        res.json({ message: 'Successfully left group' });
    } catch (error) {
        res.status(500).json({ message: 'Error leaving group cart' });
    }
});

module.exports = router;
