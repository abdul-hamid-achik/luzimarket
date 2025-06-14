import React from 'react';
import ProductManagement from '@/components/shared/ProductManagement';

const CMSProductManagement = () => {
    return (
        <ProductManagement 
            isEmployeeDashboard={false}
            showVendorField={true}
            showDeliveryZones={true}
        />
    );
};

export default CMSProductManagement;