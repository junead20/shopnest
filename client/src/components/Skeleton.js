// client/src/components/Skeleton.js
import React from 'react';

const Skeleton = ({ className, type = 'text' }) => {
  const baseClasses = "skeleton";
  
  const typeClasses = {
    text: "h-4 w-full mb-2",
    title: "h-8 w-3/4 mb-4",
    avatar: "h-12 w-12 rounded-full",
    image: "h-48 w-full mb-4",
    button: "h-10 w-full rounded-xl",
    card: "h-64 w-full rounded-2xl"
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type] || ''} ${className || ''}`} />
  );
};

export const ProductCardSkeleton = () => (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 h-full flex flex-col">
        <Skeleton type="image" className="rounded-2xl" />
        <Skeleton type="text" className="w-1/2 mb-4" />
        <Skeleton type="title" className="mb-2" />
        <div className="mt-auto flex justify-between items-center">
            <Skeleton type="text" className="w-1/4 h-6 mb-0" />
            <Skeleton type="avatar" className="h-10 w-10 rounded-xl" />
        </div>
    </div>
);

export const ProductDetailsSkeleton = () => (
    <div className="container mx-auto px-4 py-8">
        <Skeleton type="text" className="w-24 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <Skeleton className="h-96 w-full rounded-3xl" />
            <div className="space-y-6">
                <Skeleton type="title" className="w-full h-12" />
                <Skeleton type="text" className="w-1/3 h-6" />
                <div className="flex gap-4">
                    <Skeleton type="text" className="w-20 h-8" />
                    <Skeleton type="text" className="w-20 h-8" />
                </div>
                <Skeleton type="text" className="w-full h-32 mt-8" />
                <div className="flex gap-4 mt-8">
                    <Skeleton type="button" className="flex-1 h-14" />
                    <Skeleton type="button" className="flex-1 h-14" />
                </div>
            </div>
        </div>
    </div>
);

export default Skeleton;
