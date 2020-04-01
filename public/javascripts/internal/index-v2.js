let workbookNameIDMapping = {}
var dimensionFieldFilterData = {}

$(document).ready(() => {
  let WorkbookAndFirstView = {}
  $('.loader').show()

  $.get('/api/workbooks',(response) => {
    let workbooks = response["workbook"]
    let workbookDOMElement = $('#workbooks')
    workbookDOMElement.empty()

    for(index in workbooks){

      let workbook = workbooks[index]
      workbookNameIDMapping[workbook["name"]] = workbook.id
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
                    `<a class="collapse-item" data-parent="${workbook["name"]}" data-id="${item["id"]}" data-name="${item["viewUrlName"]}" 
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

          initializeViz(url,workbookNameIDMapping[workbookName],view.id)
         
        }
          
      })
    }
  })
})

var initializeViz = (url,workbookID,viewID) => {
  $('#no-view').addClass('d-none')
  $('#export-pdf').removeClass('d-none')
  dimensionFieldFilterData = {}
  // JS object that points at empty div in the html
  var placeholderDiv = document.getElementById("tableauViz");
  
  var options = {
    width: '100%',
    height: '80vh',
    hideTabs: true,
    hideToolbar: true,
    onFirstInteractive: function() {
      var Activesheet = viz.getWorkbook().getActiveSheet()

      if(typeof Activesheet.getFiltersAsync !== 'undefined'){
        clearCurrentFilter(Activesheet)
      }
      else if(typeof Activesheet.getWorksheets !== 'undefined'){
        // sheets = Activesheet.getWorksheets()
        // for(sheet of sheets){
        //   clearCurrentFilter(sheet)
        // }
      } 

    }
  };
  viz = new tableau.Viz(placeholderDiv, url, options);
  
}


var clearCurrentFilter = (Activesheet) => {
  Activesheet.getFiltersAsync().always(filters=>{
    filterNameList = []
    filters.forEach(item=>{
      filterNameList.push(item.getFieldName())
    })
    for(filterName of filterNameList){
      Activesheet.clearFilterAsync(filterName).then((res)=>{
        if(res === filterNameList[parseInt(filterNameList.length -1 )]){
          createFilterDataSource(Activesheet)
          return
        }
      })
    }
  })
}

var exportPDF = () => {
  viz.showExportPDFDialog();
}


var applyFilterValue = (filterName,value) => {
  var Activesheet = viz.getWorkbook().getActiveSheet();

  if(typeof Activesheet.getWorksheets !== 'undefined'){
    // sheets = Activesheet.getWorksheets()
    // for(sheet of sheets){
    //   if (value === "") {
    //     sheet.clearFilterAsync(filterName);
    //   } else {
    //     sheet.applyFilterAsync(filterName, value, tableau.FilterUpdateType.REPLACE);
    //   }
    // }
  }
  else{
    if (value === "") {
      Activesheet.clearFilterAsync(filterName);
    } else {
      Activesheet.applyFilterAsync(filterName, value, tableau.FilterUpdateType.REPLACE);
    }
  }
 
}


var createFilterDataSource = (Activesheet) => {
  
  Activesheet.getDataSourcesAsync().then((response)=>{
      var dimensionFields = []
      var dimensionFieldsPosMapping = {}

      for(dataSource of response ){
          for(field of dataSource.getFields()){
              if(field.getRole() === 'dimension')
                  dimensionFields.push(field.getName())
                  if(!(field.getName() in dimensionFieldFilterData)){
                    dimensionFieldFilterData[`${field.getName()}`] = {'dataType': null, 'data': new Set()}
                  }
          }
      }

      Activesheet.getUnderlyingDataAsync().then(dataRes=>{
          for(index in dataRes.getColumns()){
              col = dataRes.getColumns()[index]
              
              if(dimensionFields.find(str => str === col.getFieldName()) ){
                  dimensionFieldsPosMapping[index] = {'fieldName': col.getFieldName(), 'dataType': col.getDataType()}
              }
          }

          for(data of dataRes.getData()){
              for(index in data){
                  if(index in dimensionFieldsPosMapping){
                      colData = data[index]
                      fieldName = dimensionFieldsPosMapping[index].fieldName
                      dataType = dimensionFieldsPosMapping[index].dataType

                      if(dataType === 'date'){
                        var date = new Date(colData.value)
                        colData.value = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),
                          date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
                      } 

                      dimensionFieldFilterData[`${fieldName}`].data.add(colData.value)
                      dimensionFieldFilterData[`${fieldName}`].dataType = dataType
                  }
              }
          }

          //remove data that has no values
          for(dimension in dimensionFieldFilterData){
            dimensionFieldFilterData[dimension].data.size ? '' : delete dimensionFieldFilterData[dimension]
          }
          
          for(filterName in dimensionFieldFilterData){
            filterDataType = dimensionFieldFilterData[filterName].dataType
            filterValues = Array.from(dimensionFieldFilterData[filterName].data)
            
            dimensionFieldFilterData[`${filterName}`].filterCreated ? '' : createFilter(filterName,filterDataType,filterValues)
            dimensionFieldFilterData[`${filterName}`].filterCreated = true
          }
      })
  })
}


var changeView = (el) => {
  $('.filter-label').addClass('d-none')
  $('#allFilters .d-flex').empty()
  $('.collapse-item').removeClass('active')
  $('#slider-filters').empty()
  $(el).addClass('active')

  let workbookName = $(el).attr('data-parent')
  let viewName = $(el).attr('data-name')
  let viewID = $(el).attr('data-id')
  let workbookID = workbookNameIDMapping[workbookName]

  viewName === 'College' ? $('#year-filter').removeClass('d-none') : $('#year-filter').addClass('d-none')
  let url =  `${tableauBaseUrl}/t/${siteName}/views/${workbookName}/${viewName}`

  if(typeof viz != "undefined"){
    viz.dispose()
  }

  initializeViz(url,workbookID,viewID)
}


var createFilter = (filterName,filterDataType,filterValues,index) => {
  if(filterDataType === 'string'){
    $('#allFilters .d-flex').append(
      `
          <div class="col">
            <div class="label-year">
              ${filterName}
            </div>
            <select class="form-control select-year" onchange="applyFilterValue('${filterName}',value)">
              <option value="">All</option>
              ${filterValues.map((item)=>{
                return `<option value="${item}">${item}</option>`
              }).join('')}
            </select>
          </div>
      `
    )
  }
  else if(filterDataType === 'date'){
      let min = Math.min(...filterValues)
      let max = Math.max(...filterValues)
      let domainMin = Math.min(...filterValues)
      let domainMax = Math.max(...filterValues)
      let minText = new Date(parseFloat(domainMin))
      minText = new Date(Date.UTC(minText.getFullYear(),minText.getMonth(),minText.getDate()))
      let maxText = new Date(parseFloat(domainMax))
      maxText = new Date(Date.UTC(maxText.getFullYear(),maxText.getMonth(),maxText.getDate()))


      $('#slider-filters').append(
        `
          <div class="row">
            <div class="col ml-5 slider-name">
              Select ${filterName}
            </div>
          </div>
          <div class="row">
            <div class="col-4 text-left" id="slider-${index}">
            </div>
          </div>
          <div class="row text-left ml-3 mt-2" id="range-value-${index}">Range:[${parseInt(minText.getMonth() + 1) + '/' + minText.getDate()    + '/' + minText.getFullYear()} -
          ${parseInt(maxText.getMonth() + 1) + '/' +maxText.getDate() + '/'  + maxText.getFullYear()}]</div>
        `
      )

      createSlider(
        `slider-${index}`,
        `range-value-${index}`,
        min,max,domainMin,domainMax,filterName
        )
  }
}

const createSlider = (id,rangeId,min,max,startMin,endMin,filterName) => {
  var slider = document.getElementById(`${id}`);
  noUiSlider.create(slider, {
      start: [min, max],
      connect: true,
      range: {
          "min":startMin,
          "max":endMin
      }
  });

  slider.noUiSlider.on('change', function(values){
    var sheet = viz.getWorkbook().getActiveSheet()

    if (typeof sheet.applyRangeFilterAsync !== "undefined" && values.length > 1) { 
      var minValue = values[0]
      var maxValue = values[1]
      if(filterName === 'Date'){
        minValue = new Date(parseFloat(minValue))
        minValue = new Date(Date.UTC(minValue.getFullYear(),minValue.getMonth(),minValue.getDate()))
        maxValue = new Date(parseFloat(maxValue))
        maxValue = new Date(Date.UTC(maxValue.getFullYear(),maxValue.getMonth(),maxValue.getDate()))
        $(`#${rangeId}`).text(
          `Range:[${parseInt(minValue.getMonth() + 1) + '/' + minValue.getDate()    + '/' + minValue.getFullYear()} -
             ${parseInt(maxValue.getMonth() + 1) + '/' +maxValue.getDate() + '/'  + maxValue.getFullYear()}]`)
      }

      sheet.applyRangeFilterAsync(filterName, {
        min: minValue,
        max: maxValue
      });
      
    }
  })
}
