const Orderdb = require('../../model/userSide/orderModel');

module.exports = {
   
    getSalesReport: async (req, res) => {
        try {
            let { reportType, filter } = req.body;
            const reportTypes = ["All", "Today", "Last Week", "Last Month", "This Year"];
            let currentType = reportType;
            let startDate;
            let endDate = new Date();

            if (!reportType || reportType === 'Today') {
                const today = new Date();
                startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);
                currentType = "Today";

            } else if (reportType === 'Last Week') {
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);

            } else if (reportType === 'Last Month') {
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);

            } else if (reportType === 'This Year') {
                startDate = new Date(new Date().getFullYear(), 0, 1);
                endDate = new Date(new Date().getFullYear(), 11, 31);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(23, 59, 59, 999);

            } else if (filter) {
                switch (filter) {
                    case 'Yearly':
                        startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
                        break;
                    case 'Monthly':
                        startDate = new Date(new Date().setMonth(new Date().getMonth() - 1));
                        break;
                    case 'Weekly':
                        startDate = new Date(new Date().setDate(new Date().getDate() - 7));
                        break;
                    case 'Daily':
                        startDate = new Date(new Date().setDate(new Date().getDate() - 1));
                        break;
                    default:
                        startDate = new Date();
                }
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
            console.log("hijnkjlkjugtdtfh");
            res.status(200).render("adminSide/salesReport", { sales: salesData, currentType, reportTypes, reportType, startDate, endDate });

        } catch (error) {
            console.log("err", error);
            res.status(500).render("errorPages/500ErrorPage");
        }
    }
};
