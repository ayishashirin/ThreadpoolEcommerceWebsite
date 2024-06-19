function generateReport() {
    const reportType = document.getElementById("reportType").value;
    window.location.href = `/getSalesReportFilter?reportType=${reportType}`;
  }

  function filterSales() {
    const filter = document.getElementById("filterSales").value;
    window.location.href = `/getSalesReportFilter?filter=${filter}`;
  }

  document.getElementById("dwnld-pdf-btn").addEventListener("click", function () {
    let doc = new window.jspdf.jsPDF();
    let pageCenter = doc.internal.pageSize.getWidth() / 2;
    const reportType = document.getElementById("reportType").value;
    doc.setFontSize(25);
    doc.text("Threadpool", pageCenter, 10, { align: "center" });
    doc.setFontSize(15);
    doc.text(`${reportType}'s Sales Report`, pageCenter, 20, { align: "center" });
    let table = document.querySelector(".table");
    doc.autoTable({
      html: table,
      startY: 35,
    });
    doc.save(`sales_report_${reportType}.pdf`);
  });

  document.getElementById("dwnld-exel-btn").addEventListener("click", function () {
    let workbook = XLSX.utils.book_new();
    let table = document.querySelector(".table");
    let worksheet = XLSX.utils.table_to_sheet(table);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
    let range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let max_width = 0;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        let cell_address = { c: C, r: R };
        let cell_ref = XLSX.utils.encode_cell(cell_address);
        if (!worksheet[cell_ref]) continue;
        let cell_width = XLSX.SSF.format(cell_address, worksheet[cell_ref].v).length;
        max_width = Math.max(max_width, cell_width);
      }
      worksheet["!cols"] = worksheet["!cols"] || [];
      worksheet["!cols"][C] = { wch: max_width + 1 };
    }
    XLSX.writeFile(workbook, "sales_report.xlsx", { bookSST: true, type: "binary" });
  });