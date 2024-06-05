const Orderdb = require('../../model/userSide/orderModel');


module.exports = {
getSalesReport:  async (req,res)=>{

 
    try {

        let { reportType, startDate, endDate } = req.query;

        const reportTypes = ["All", "Today", "Last Week", "Last Month", "This Year"];
        let currentType = reportType;

        if (!reportType || reportType === 'Today') {
            const today = new Date();
            startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            currentType = "Today";

        } else if (reportType === 'Last Week') {
            const today = new Date();
            startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
            endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

        } else if (reportType === 'Last Month') {
            const today = new Date();
            startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);


        } else if (reportType === 'This Year') {
            const today = new Date();
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear() + 1, 0, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

        } 


        let salesData;

        if (reportType === 'All') {

            salesData = await Orderdb.aggregate([
                { $unwind: "$orderItems" },
                { $match: { "orderItems.status": { $nin: ["Cancelled", "Returned"] } } },
                {
                    $lookup: {
                        from: "productdbs",
                        localField: "orderItems.productId",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                { $sort: { orderDate: -1 } }
            ]);

        } else {

            salesData = await Orderdb.aggregate([
                {
                    $match: {
                        orderDate: { $gte: startDate, $lte: endDate }
                    }
                },
                { $unwind: "$orderItems" },
                { $match: { "orderItems.orderStatus": { $nin: ["Cancelled", "Returned"] } } },
                {
                    $lookup: {
                        from: "productdbs",
                        localField: "orderItems.productId",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                { $unwind: "$productDetails" },
                { $sort: { orderDate: -1 } }
            ]);
        }
        res.status(200).render("adminSide/salesReport", { sales: salesData, currentType, reportTypes, reportType, startDate, endDate });

    } catch (error) {
        console.log("err", err);
        res.status(500).render("errorPages/500ErrorPage"); 
      }
}}

