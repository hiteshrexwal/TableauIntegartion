
$(document).ready(() => {
  let WorkbookAndFirstView = {}
  $('.loader').show()

  $.get('/api/workbooks',(response) => {
    let workbooks = response["workbook"]
    let workbookDOMElement = $('#workbooks')
    workbookDOMElement.empty()

    for(index in workbooks){

      let workbook = workbooks[index]
      let currentIndex = index 

      $.get(`/api/workbook/${workbook["id"]}/views`,(viewResponse) => {
        let views = viewResponse["view"]
        WorkbookAndFirstView[`${workbook["name"]}`] =views[0]

        workbookDOMElement.append(
          `
            <li class="nav-item">
              <a class="nav-link collapsed" href="#" data-toggle="collapse" data-target="#collapse${currentIndex}"
                aria-expanded="true" aria-controls="collapse${currentIndex}">

                <i class="fas fa-fw fa-cog"></i>
                <span>${workbook["name"]}</span>

              </a>
              <div class="collapse" id="collapse${currentIndex}" aria-labelledby="heading${currentIndex}" data-parent="#accordionSidebar">

                <div class="bg-white py-2 collapse-inner rounded">
                  <h6 class="collapse-header">Views:</h6>
                  ${views.length ? views.map((item)=>(
                    `<a class="collapse-item" data-parent="${workbook["name"]}" data-name="${item["viewUrlName"]}" 
                      onclick="changeView(this)" href="#">${item["name"]}</a>`
                  )).join(' ') : '<a class="collapse-item" href="#">No views</a>'}
                </div>

              </div>
            </li>
          `
        )
        
      }).then(()=>{
        if(parseInt(currentIndex) + 1 === parseInt(workbooks.length)){
          $('.loader').hide()
          for (var key in WorkbookAndFirstView) { 
            if (WorkbookAndFirstView[key] === null || WorkbookAndFirstView[key] === undefined) {
              delete WorkbookAndFirstView[key];
            }
          }

          let workbookName = Object.keys(WorkbookAndFirstView)[0]
          let view = WorkbookAndFirstView[`${workbookName}`]
          
          if(!view){
            $('#no-view').removeClass('d-none')
            return
          }
          let url =  `${tableauBaseUrl}/t/${siteName}/views/${workbookName}/${view['viewUrlName']}`
          
          //adding active class to the view selected and opening the workbook in sidebar
          $(`a[data-name="${view['viewUrlName']}"]`).addClass('active')
          $(`a[data-name="${view['viewUrlName']}"]`).parent().parent().addClass('show')
          $(`a[data-name="${view['viewUrlName']}"]`).parent().parent().parent().find('a').removeClass('collapsed')

          initializeViz(url)
         
        }
          
      })
    }
  })
})

var initializeViz = (url) => {
  $('#no-view').addClass('d-none')
  $('#export-pdf').removeClass('d-none')
  // JS object that points at empty div in the html
  var placeholderDiv = document.getElementById("tableauViz");
  
  var options = {
    width: '100%',
    height: '80vh',
    hideTabs: true,
    hideToolbar: true,
  };
  viz = new tableau.Viz(placeholderDiv, url, options);
}

var exportPDF = () => {
  viz.showExportPDFDialog();
}

var yearFilter = (year) => {
  var sheet = viz.getWorkbook().getActiveSheet();
  if (year === "") {
      sheet.clearFilterAsync("Academic Year");
  } else {
      sheet.applyFilterAsync("Academic Year", year, tableau.FilterUpdateType.REPLACE);
  }
}

var changeView = (el) => {
  $('.collapse-item').removeClass('active')
  $(el).addClass('active')

  let workbookName = $(el).attr('data-parent')
  let viewName = $(el).attr('data-name')

  viewName === 'College' ? $('#year-filter').removeClass('d-none') : $('#year-filter').addClass('d-none')
  let url =  `${tableauBaseUrl}/t/${siteName}/views/${workbookName}/${viewName}`
  console.log(url)

  viz ? viz.dispose() : ''

  initializeViz(url)
}