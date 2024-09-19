const setBreadcrumbs = (req, res, next) => {
    const path = req.path.replace(/\/$/, ''); 
    let breadcrumbs = [{ name: 'Home', link: '/' }];

   
    if (path.startsWith('/user')) {
        breadcrumbs.push({ name: 'User Profile', link: '/userProfile' });
    }

    switch (path) {
        case '/userProfile':
            break; 
        case '/user/my-order':
            breadcrumbs.push({ name: 'My Orders', link: '/user/my-order' });
            break;
        case '/user/account':
            breadcrumbs.push({ name: 'My Account', link: '/user/account' });
            break;
        case '/user/address':
            breadcrumbs.push({ name: 'My Address', link: '/user/address' });
            break;
        default:
           
            if (path.startsWith('/user/')) {
                const subPath = path.replace('/user/', '');
                breadcrumbs.push({ name: subPath.charAt(0).toUpperCase() + subPath.slice(1), link: path });
            }
    }

    res.locals.breadcrumbs = breadcrumbs;
    next();
};


module.exports = setBreadcrumbs;
