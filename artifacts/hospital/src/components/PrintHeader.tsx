import React from 'react';

export function PrintHeader({ title }: { title: string }) {
  return (
    <div className="hidden print:block mb-8 border-b-2 border-primary pb-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">GLOBAL HOSPITAL</h1>
          <p className="text-sm text-gray-600 mt-1">No.16, 12th Avenue, Ashok Nagar, Chennai - 600083</p>
          <p className="text-sm text-gray-600">Phone: 96293 00281 / 87542 57951</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-800 uppercase">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
