import React from 'react';

// Minimal, self-contained admin layout with a placeholder sidebar.
// Matches App.jsx which imports a named export { AdminLayout } from this module.
export const AdminLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-background">
            <div className="flex">
                {/* Sidebar placeholder (kept minimal to avoid extra dependencies) */}
                <aside className="hidden md:block w-64 border-r border-border p-6">
                    <div className="text-xl font-bold">Admin</div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Use the navigation to access admin pages.
                    </p>
                </aside>

                {/* Main content */}
                <main className="flex-1 p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;

