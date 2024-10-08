const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");

const User = require("../../models/userSchema")
const Order = require("../../models/orderSchema")
const Offer = require("../../models/offerSchema")

const fs = require("fs");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp")


const Excel = require('exceljs');
const PDFDocument = require('pdfkit');


const getSalesReport = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const stats = await calculateStats(startOfDay, endOfDay);
        
        res.render("sales-report", {
            ...stats,
            dateRange: 'daily',
            startDate: startOfDay,
            endDate: endOfDay
        });
    } catch (error) {
        console.error("Error in getSalesReport:", error);
        res.status(500).redirect("/admin/error");
    }
};

const filterSalesReport = async (req, res) => {
    try {
        const { dateFilter, startDate, endDate } = req.body;
        const today = new Date();
        let start, end;

        switch (dateFilter) {
            case 'daily':
                start = new Date(today.setHours(0, 0, 0, 0));
                end = new Date(today.setHours(23, 59, 59, 999));
                break;
            case 'weekly':
                start = new Date(today.setDate(today.getDate() - 7));
                end = new Date(new Date().setHours(23, 59, 59, 999));
                break;
            case 'monthly':
                start = new Date(today.setMonth(today.getMonth() - 1));
                end = new Date(new Date().setHours(23, 59, 59, 999));
                break;
            case 'yearly':
                start = new Date(today.setFullYear(today.getFullYear() - 1));
                end = new Date(new Date().setHours(23, 59, 59, 999));
                break;
            case 'custom':
                if (!startDate || !endDate) {
                    throw new Error("Start and end dates are required for custom range");
                }
                start = new Date(startDate);
                end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                break;
            default:
                throw new Error("Invalid date filter");
        }

        const stats = await calculateStats(start, end);
        
        res.render("sales-report", {
            ...stats,
            dateRange: dateFilter,
            startDate: start,
            endDate: end
        });
    } catch (error) {
        console.error("Error in filterSalesReport:", error);
        res.status(400).render("sales-report", {
            error: error.message,
            totalOrders: 0,
            totalSales: 0,
            totalDiscount: 0,
            totalActualPrice: 0,
            totalOfferPrice: 0,
            dateRange: 'daily'
        });
    }
};

const calculateStats = async (startDate, endDate) => {
    const orders = await Order.find({
        date: { 
            $gte: startDate, 
            $lte: endDate 
        }
    });

    // Calculate existing order-level stats
    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalDiscount = orders.reduce((sum, order) => sum + order.discount, 0);
    const totalActualPrice = orders.reduce((sum, order) => sum + order.actualPrice, 0);
    const totalOfferPrice = orders.reduce((sum, order) => sum + order.offerPrice, 0);

    // Now integrate the detailed item-level stats from calculateOrderStats
    const detailedStats = calculateOrderStats(orders);

    return { 
        totalOrders, 
        totalSales, 
        totalDiscount, 
        totalActualPrice, 
        totalOfferPrice,
        ...detailedStats  // Spread the detailed stats into the return object
    };
};

const calculateOrderStats = (orders) => {
    // Filtering orders where payment status is "completed"
    const completedOrders = orders.filter(order => 
        order.payment.some(payment => payment.status === "completed")
    );

    // Total number of items in all completed orders
    const totalItemOrders = completedOrders.reduce((sum, order) => sum + order.items.length, 0);

    // Total payment received (sum of saledPrice for items in completed orders)
    const TotalPaymentRecieved = completedOrders.reduce((sum, order) => {
        return sum + order.items.reduce((itemSum, item) => itemSum + item.saledPrice, 0);
    }, 0);

    // Total actual price of items (sum of regularPrice for items in completed orders)
    const itemsActualTotal = completedOrders.reduce((sum, order) => {
        return sum + order.items.reduce((itemSum, item) => itemSum + item.regularPrice, 0);
    }, 0);

    // Actual total discount
    const ActualTotalDiscount = itemsActualTotal - TotalPaymentRecieved;

    // Total offer discount (difference between regularPrice and price for items in completed orders)
    const totalOfferDiscount = completedOrders.reduce((sum, order) => {
        return sum + order.items.reduce((itemSum, item) => itemSum + (item.regularPrice - item.price), 0);
    }, 0);

    // Coupon and other discount
    const couponAndOtherDiscount = ActualTotalDiscount - totalOfferDiscount;

    // Calculate sum of saledPrice for items that were returned
    const returnedItemTotal = completedOrders.reduce((sum, order) => {
        return sum + order.items.reduce((itemSum, item) => {
            return item.itemOrderStatus === "Returned" ? itemSum + item.saledPrice : itemSum;
        }, 0);
    }, 0);

    return {
        totalItemOrders,
        TotalPaymentRecieved,
        itemsActualTotal,
        ActualTotalDiscount,
        totalOfferDiscount,
        couponAndOtherDiscount,
        returnedItemTotal  // Sum of saledPrice for returned items
    };
};



const downloadReport = async (req, res) => {
    try {
        const { format, dateFilter, startDate, endDate } = req.body;
        const today = new Date();
        let start, end;

        switch (dateFilter) {
            case 'daily':
                start = new Date(today.setHours(0, 0, 0, 0));
                end = new Date(today.setHours(23, 59, 59, 999));
                break;
            case 'weekly':
                start = new Date(today.setDate(today.getDate() - 7));
                end = new Date(new Date().setHours(23, 59, 59, 999));
                break;
            case 'monthly':
                start = new Date(today.setMonth(today.getMonth() - 1));
                end = new Date(new Date().setHours(23, 59, 59, 999));
                break;
            case 'yearly':
                start = new Date(today.setFullYear(today.getFullYear() - 1));
                end = new Date(new Date().setHours(23, 59, 59, 999));
                break;
            case 'custom':
                start = new Date(startDate);
                end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                break;
            default:
                throw new Error("Invalid date filter");
        }

        // Fetch completed orders with item details
        const completedOrders = await fetchCompletedOrdersWithItems(start, end);

        if (format === 'excel') {
            await generateExcel(res, completedOrders, dateFilter, start, end);
        } else if (format === 'pdf') {
            await generatePDF(res, completedOrders, dateFilter, start, end);
        } else {
            throw new Error("Invalid format specified");
        }

    } catch (error) {
        console.error("Error in downloadReport:", error);
        res.status(500).send("Error generating report");
    }
};


const fetchCompletedOrdersWithItems = async (startDate, endDate) => {
    const orders = await Order.find({
        date: { 
            $gte: startDate, 
            $lte: endDate 
        },
        'payment.status': 'completed'  // Filtering based on completed payment status
    }).populate('items.product');  // Populate product details for each item

    return orders.map(order => ({
        orderId: order._id,
        orderDate: order.date,
        totalPrice: order.totalPrice,
        items: order.items.map(item => ({
            productName: item.product?.productName || 'Deleted Product',
            skuNumber: item.product?.skuNumber || 'N/A',
            description: item.product?.description || 'N/A',
            color: item.product?.color || 'N/A',
            regularPrice: item.regularPrice,
            saledPrice: item.saledPrice,
            quantity: item.quantity,
            itemOrderStatus: item.itemOrderStatus,
            itemOrderId: item.itemOrderId,
        })),
    }));
};

const generateExcel = async (res, orders, dateFilter, startDate, endDate) => {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.addRow(['Sales Report']);
    worksheet.addRow(['Date Range:', `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`]);
    worksheet.addRow(['']);

    // Add table headings
    worksheet.addRow([ 
        'SI', 'Item Order ID', 'Date', 'Product', 'SKU', 'Color', 
        'Regular Price', 'Saled Price', 'Quantity', 'Order Status', 
        'Discount', 'Net Price'
    ]);

    let si = 1;
    let totalRegularPrice = 0;
    let totalSaledPrice = 0;
    let totalQuantity = 0;
    let totalDiscount = 0;
    let totalNetPrice = 0;

    // Populate table with values
    orders.forEach(order => {
        order.items.forEach(item => {
            // Correct the calculations here
            const regularPrice = item.regularPrice * item.quantity; // Correct calculation
            const saledPrice = item.saledPrice * item.quantity; // Correct calculation
            const discount = (item.regularPrice - item.saledPrice) * item.quantity; // Discount calculation
            const netPrice = saledPrice; // Net price calculation
            
            // Safe access to payment status
            const paymentStatus = Array.isArray(order.payment) 
                ? order.payment.find(payment => payment.status === 'completed')?.status || 'N/A'
                : 'N/A';

            worksheet.addRow([ 
                si++, 
                item.itemOrderId || 'N/A',
                order.orderDate ? order.orderDate.toLocaleString() : 'N/A',
                item.productName || 'N/A',
                item.skuNumber || 'N/A',
                item.color || 'N/A',
                regularPrice.toFixed(2), // Use calculated regularPrice
                saledPrice.toFixed(2),   // Use calculated saledPrice
                item.quantity || 0,
                paymentStatus,
                discount.toFixed(2),     // Use calculated discount
                netPrice.toFixed(2)     // Use calculated netPrice
            ]);

            // Update totals
            totalRegularPrice += regularPrice;
            totalSaledPrice += saledPrice;
            totalQuantity += item.quantity || 0;
            totalDiscount += discount;
            totalNetPrice += netPrice;
        });
    });

    // Add totals row
    worksheet.addRow([ 
        '', '', '', '', '', 'TOTAL', 
        totalRegularPrice.toFixed(2),
        totalSaledPrice.toFixed(2),
        totalQuantity,
        '',
        totalDiscount.toFixed(2),
        totalNetPrice.toFixed(2)
    ]);

    // Set column widths for better readability
    worksheet.getColumn(1).width = 5;
    worksheet.getColumn(2).width = 20;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 30;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 10;
    worksheet.getColumn(7).width = 15;
    worksheet.getColumn(8).width = 15;
    worksheet.getColumn(9).width = 10;
    worksheet.getColumn(10).width = 15;
    worksheet.getColumn(11).width = 15;
    worksheet.getColumn(12).width = 15;

    // Set headers for Excel file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${dateFilter}.xlsx`);

    await workbook.xlsx.write(res);
};


const generatePDF = async (res, orders, dateFilter, startDate, endDate) => {
    const doc = new PDFDocument({ margin: 10, size: 'A4', layout: 'landscape' });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${dateFilter}.pdf`);

    doc.pipe(res);

    const itemsPerPage = 7;
    let currentPage = 1;
    let itemsOnCurrentPage = 0;

    let totalRegularPrice = 0;
    let totalSaledPrice = 0;
    let totalQuantity = 0;
    let totalDiscount = 0;
    let totalNetPrice = 0;

    // Set fixed starting Y position for the first page
    let fixedY = 150; // **Modification: Starting Y position**

    const addHeader = () => {
        doc.fontSize(16).text('Sales Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Date Range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`, { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(10).text('SI', 30, 80, { continued: false, width: 10 });
        doc.text('Order ID', 60, 80, { continued: false, width: 60 });
        doc.text('Date', 140, 80, { continued: false, width: 60 });
        doc.text('Product', 220, 80, { continued: false, width: 60 });
        doc.text('SKU', 320, 80, { continued: false, width: 60 });
        doc.text('Color', 380, 80, { continued: false, width: 60 });
        doc.text('Regular Price', 430, 80, { continued: false, width: 60 });
        doc.text('Saled Price', 500, 80, { continued: false, width: 60 });
        doc.text('Quantity', 570, 80, { continued: false, width: 60 });
        doc.text('Order Status', 620, 80, { continued: false, width: 60 });
        doc.text('Discount', 690, 80, { continued: false, width: 60 });
        doc.text('Net Price', 750, 80, { width: 60 });
        doc.moveDown();
    };

    const addPageTotal = () => {
        doc.text('Total:', 320, fixedY, { continued: false });
        doc.text(totalRegularPrice.toFixed(2), 430, fixedY, { continued: false, width: 60 });
        doc.text(totalSaledPrice.toFixed(2), 500, fixedY, { continued: false, width: 60 });
        doc.text(totalQuantity.toString(), 570, fixedY, { continued: false, width: 60 });
        doc.text(totalDiscount.toFixed(2), 690, fixedY, { continued: false, width: 60 });
        doc.text(totalNetPrice.toFixed(2), 750, fixedY, { width: 60 });
    };

    const resetPageTotals = () => {
        totalRegularPrice = 0;
        totalSaledPrice = 0;
        totalQuantity = 0;
        totalDiscount = 0;
        totalNetPrice = 0;
    };

    addHeader();

    let si = 1;
    let grandTotalRegularPrice = 0;
    let grandTotalSaledPrice = 0;
    let grandTotalQuantity = 0;
    let grandTotalDiscount = 0;
    let grandTotalNetPrice = 0;

    orders.forEach((order, orderIndex) => {
        order.items.forEach((item, itemIndex) => {
            if (itemsOnCurrentPage === itemsPerPage) {
                addPageTotal();
                doc.addPage();
                currentPage++;
                itemsOnCurrentPage = 0;
                resetPageTotals();
                addHeader();
                fixedY = 150; // **Modification: Reset Y position to 150 on page break**
            }

            // Correct the calculations
            const regularPrice = item.regularPrice * item.quantity; // Correct calculation
            const saledPrice = item.saledPrice * item.quantity; // Correct calculation
            const discount = (item.regularPrice - item.saledPrice) * item.quantity; // Correct discount calculation
            const netPrice = saledPrice; // Net price calculation

            const paymentStatus = Array.isArray(order.payment) 
                ? order.payment.find(payment => payment.status === 'completed')?.status || 'N/A'
                : 'N/A';

            doc.fontSize(8)
                .text(si++, 30, fixedY, { continued: false, width: 10 })
                .text(item.itemOrderId || 'N/A', 60, fixedY, { continued: false, width: 60 })
                .text(order.orderDate ? order.orderDate.toLocaleString() : 'N/A', 140, fixedY, { continued: false, width: 60 })
                .text(item.productName || 'N/A', 220, fixedY, { continued: false, width: 60 })
                .text(item.skuNumber || 'N/A', 320, fixedY, { continued: false, width: 60 })
                .text(item.color || 'N/A', 380, fixedY, { continued: false, width: 60 })
                .text(regularPrice.toFixed(2), 430, fixedY, { continued: false, width: 60 })
                .text(saledPrice.toFixed(2), 500, fixedY, { continued: false, width: 60 })
                .text((item.quantity || 0).toString(), 570, fixedY, { continued: false, width: 60 })
                .text(paymentStatus, 620, fixedY, { continued: false, width: 60 })
                .text(discount.toFixed(2), 690, fixedY, { continued: false, width: 60 })
                .text(netPrice.toFixed(2), 750, fixedY, { width: 60 });

            totalRegularPrice += regularPrice;
            totalSaledPrice += saledPrice;
            totalQuantity += item.quantity || 0;
            totalDiscount += discount;
            totalNetPrice += netPrice;

            grandTotalRegularPrice += regularPrice;
            grandTotalSaledPrice += saledPrice;
            grandTotalQuantity += item.quantity || 0;
            grandTotalDiscount += discount;
            grandTotalNetPrice += netPrice;

            itemsOnCurrentPage++;
            fixedY += 50;

            if (orderIndex === orders.length - 1 && itemIndex === order.items.length - 1) {
                addPageTotal();
                doc.moveDown();
                doc.text('Grand Total:', 320, fixedY +=50, { continued: false });
                doc.text(grandTotalRegularPrice.toFixed(2), 430, fixedY, { continued: false, width: 60 });
                doc.text(grandTotalSaledPrice.toFixed(2), 500, fixedY, { continued: false, width: 60 });
                doc.text(grandTotalQuantity.toString(), 570, fixedY, { continued: false, width: 60 });
                doc.text(grandTotalDiscount.toFixed(2), 690, fixedY, { continued: false, width: 60 });
                doc.text(grandTotalNetPrice.toFixed(2), 750, fixedY, { continued:false, width: 60 });
            }
        });
    });

    doc.end();
};

module.exports = {
    getSalesReport,
    filterSalesReport,
    downloadReport
};