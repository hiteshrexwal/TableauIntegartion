function initializeViz() {
    // JS object that points at empty div in the html
    var placeholderDiv = document.getElementById("tableauViz");
    // URL of the viz to be embedded
    // var url = "http://public.tableau.com/views/WorldIndicators/GDPpercapita";
    // var url = "https://prod-apnortheast-a.online.tableau.com/t/wngd/views/Regional/GlobalTemperatures?:iid=2"
    
    // OwinhUfBSQKFQnk/+DYEWA==:scD3SdCiO1B10aeeukSftSALFEzulWpr
    // An object that contains options specifying how to embed the viz
    var options = {
      width: '100%',
      height: '80vh',
      hideTabs: true,
      hideToolbar: true,
    };
    viz = new tableau.Viz(placeholderDiv, url, options);
}

function exportPDF() {
  viz.showExportPDFDialog();
}

initializeViz()