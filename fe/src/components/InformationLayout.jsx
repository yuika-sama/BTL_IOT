import React from 'react';
import TopBar from './InformationComponents/TopBar.jsx';
import Table from './InformationComponents/Table.jsx';
import Pagination from './InformationComponents/Pagination.jsx';

export default function InformationLayout({filterOptions = [], columns = [], data=[], }) {
    return (
        <div className="min-h-screen">
            <TopBar filterOptions={filterOptions} />
            <div>
                <Table columns={columns} data={data} />
                <Pagination 
                    currentPage={1} 
                    totalPages={Math.ceil(data.length / 10)} 
                    totalItems={data.length} 
                    itemsPerPage={10} 
                    onPageChange={(page) => console.log(`Change to page ${page}`)} 
                />
            </div>
        </div>
    );
}