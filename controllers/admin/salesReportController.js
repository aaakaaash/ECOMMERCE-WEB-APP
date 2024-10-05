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
        res.status(400).render("admin/sales-report", {
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

    const totalOrders = orders.length;
    const totalSales = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const totalDiscount = orders.reduce((sum, order) => sum + order.discount, 0);
    const totalActualPrice = orders.reduce((sum, order) => sum + order.actualPrice, 0);
    const totalOfferPrice = orders.reduce((sum, order) => sum + order.offerPrice, 0);

    return { 
        totalOrders, 
        totalSales, 
        totalDiscount, 
        totalActualPrice, 
        totalOfferPrice,
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

        const stats = await calculateStats(start, end);

        if (format === 'excel') {
            await generateExcel(res, stats, dateFilter, start, end);
        } else if (format === 'pdf') {
            await generatePDF(res, stats, dateFilter, start, end);
        } else {
            throw new Error("Invalid format specified");
        }

    } catch (error) {
        console.error("Error in downloadReport:", error);
        res.status(500).send("Error generating report");
    }
};

const generateExcel = async (res, stats, dateFilter, startDate, endDate) => {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.addRow(['Sales Report']);
    worksheet.addRow(['']);
    worksheet.addRow(['Date Range:', `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`]);
    worksheet.addRow(['']);

    worksheet.addRow(['Sales Summary']);
    worksheet.addRow(['']);
    worksheet.addRow(['Metric', 'Value']);
    worksheet.addRow(['']);
    worksheet.addRow(['Total Orders', stats.totalOrders]);
    worksheet.addRow(['']);
    worksheet.addRow(['Total Sales', `₹${stats.totalSales}`]);
    worksheet.addRow(['']);
    worksheet.addRow(['Total Discount', `₹${stats.totalDiscount}`]);
    worksheet.addRow(['']);
    worksheet.addRow(['Total Actual Price', `₹${stats.totalActualPrice}`]);
    worksheet.addRow(['']);
    worksheet.addRow(['Total Sale Price', `₹${stats.totalOfferPrice}`]);

    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 15;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${dateFilter}.xlsx`);

    await workbook.xlsx.write(res);
};

const generatePDF = async (res, stats, dateFilter, startDate, endDate) => {
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${dateFilter}.pdf`);

    doc.pipe(res);

    doc.fontSize(16).text('Sales Report', { align: 'center' });
    doc.moveDown(); 
    doc.fontSize(12).text(`Date Range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text('Sales Summary');
    doc.fontSize(12);
    doc.moveDown();
    doc.text(`Total Orders: ${stats.totalOrders}`);
    doc.moveDown();
    doc.text(`Total Sales: ₹${stats.totalSales}`);
    doc.moveDown();
    doc.text(`Total Discount: ₹${stats.totalDiscount}`);
    doc.moveDown();
    doc.text(`Total Actual Price: ₹${stats.totalActualPrice}`);
    doc.moveDown();
    doc.text(`Total Sale Price: ₹${stats.totalOfferPrice}`);
    

    doc.end();
};

module.exports = {
    getSalesReport,
    filterSalesReport,
    downloadReport
};