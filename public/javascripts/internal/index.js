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
    onFirstInteractive: function() {
      // The viz is now ready and can be safely used.
      var sheet = viz.getWorkbook().getActiveSheet()
      console.log("Sheet",sheet)

      if (typeof sheet.getFiltersAsync !== "undefined") { 
        var currentPos = 0
        sheet.getFiltersAsync().always((filters) => {
          for(filter of filters){
            $('.filter-label').removeClass('d-none')

            if(filter.getFilterType() === 'categorical'){

              $('#allFilters .d-flex').append(
                `
                    <div class="col">
                      <div class="label-year">
                        ${filter.getFieldName()}
                      </div>
                      <select class="form-control select-year" onchange="applyFilterValue('${filter.getFieldName()}',value)">
                        <option value="">All</option>
                        ${filter.getAppliedValues().map((item)=>{
                          return `<option value="${item.value}">${item.formattedValue}</option>`
                        }).join('')}
                      </select>
                    </div>
                `
              )
            }
            else if(filter.getFilterType() === 'quantitative'){
              console.log("min =",filter.getMin(),"max = ",filter.getMax(),"domain min = ",filter.getDomainMin(),"domain max = ",filter.getDomainMax())
              console.log(filter.getFilterType())
              console.log(filter.getFieldName())
              $('.slider-filters').append(
                `
                  <div class="row">
                    <div class="col">
                      ${filter.getFieldName()}
                    </div>
                    <div class="col-4" id="slider-${currentPos}">
                    </div>
                  </div> 
                  <div class="text-right" id="range-value-${currentPos}">Range:[${filter.getMin().formattedValue} - ${filter.getMax().formattedValue}]</div>
                `
              )
              createSlider(
                `slider-${currentPos}`,
                `range-value-${currentPos}`,
                filter.getMin(),
                filter.getMax(),
                filter.getDomainMin(),
                filter.getDomainMax(),
                filter.getFieldName()
                )
            }
            else{
              console.log(filter.getFilterType())
            }
            currentPos++
          }
        })
      }
      else{
        console.log("no async filter")
      }
    }
  };
  viz = new tableau.Viz(placeholderDiv, url, options);
  
}

var exportPDF = () => {
  viz.showExportPDFDialog();
}

var applyFilterValue = (filterName,value) => {
  var sheet = viz.getWorkbook().getActiveSheet();
  if (value === "") {
      sheet.clearFilterAsync(filterName);
  } else {
      sheet.applyFilterAsync(filterName, value, tableau.FilterUpdateType.REPLACE);
  }
}

var changeView = (el) => {
  $('.filter-label').addClass('d-none')
  $('#allFilters .d-flex').empty()
  $('.collapse-item').removeClass('active')
  $('.slider-filters').empty()
  $(el).addClass('active')

  let workbookName = $(el).attr('data-parent')
  let viewName = $(el).attr('data-name')

  viewName === 'College' ? $('#year-filter').removeClass('d-none') : $('#year-filter').addClass('d-none')
  let url =  `${tableauBaseUrl}/t/${siteName}/views/${workbookName}/${viewName}`
  console.log(url)

  if(typeof viz != "undefined"){
    viz.dispose()
  }

  initializeViz(url)
}

const createSlider = (id,rangeId,min,max,startMin,endMin,filterName) => {
  console.log(id,min,max,startMin,endMin)
    var slider = document.getElementById(`${id}`);
    console.log(slider)
    noUiSlider.create(slider, {
        start: [min.value, max.value],
        connect: true,
        range: {
            "min":startMin.value,
            "max":endMin.value
        }
    });

    slider.noUiSlider.on('change', function(values){
      console.log(filterName)
      console.log("here")
      var sheet = viz.getWorkbook().getActiveSheet()

      if (typeof sheet.applyRangeFilterAsync !== "undefined" && values.length > 1) { 
        console.log("inside apply",values)
        var minValue = values[0]
        var maxValue = values[1]
        if(filterName === 'Date'){
          minValue = new Date(parseFloat(minValue))
          minValue = new Date(Date.UTC(minValue.getFullYear(),minValue.getMonth(),minValue.getDate()))
          maxValue = new Date(parseFloat(maxValue))
          maxValue = new Date(Date.UTC(maxValue.getFullYear(),maxValue.getMonth(),maxValue.getDate()))
          console.log(minValue,maxValue)
          $(`#${rangeId}`).text(
            `Range:[${minValue.getDate() + '/' + minValue.getMonth() + '/' + minValue.getFullYear()} -
               ${maxValue.getDate() + '/' + maxValue.getMonth() + '/' + maxValue.getFullYear()}]`)
        }

        sheet.applyRangeFilterAsync(filterName, {
          // min: new Date(values[0]),
          // max: new Date(values[1])
          min: minValue,
          max: maxValue
        });
        
      }
    })
}