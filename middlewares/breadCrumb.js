const setBreadcrumbs = (req, res, next) => {
    const path = req.path.replace(/\/$/, '');
    let breadcrumbs = [{ name: 'Home', link: '/' }];

    if (path.startsWith('/user')) {
        breadcrumbs.push({ name: 'User Profile', link: '/userProfile' });
    }

    const pathSegments = path.split('/').filter(Boolean);
    let currentPath = '';

    for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        currentPath += `/${segment}`;
        let name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        
        if (segment === 'my-order') {
            name = 'My Orders';
            breadcrumbs.push({ name, link: currentPath });
        } else if (segment === 'order-details') {
            name = 'Order Details';
            breadcrumbs.push({ name, link: '#' });
            break; // Stop here to avoid adding orderId and productId
        } else if (!segment.match(/^[0-9a-fA-F]{24}$/)) {
            // Only add to breadcrumb if it's not a MongoDB ObjectId
            breadcrumbs.push({ name, link: currentPath });
        }
    }

    res.locals.breadcrumbs = breadcrumbs;
    next();
};

module.exports = setBreadcrumbs;