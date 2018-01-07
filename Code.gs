function onOpen() {
    SpreadsheetApp.getUi()
      .createMenu('Wallace Quality')
      .addItem('Trend Chart', 'viewChart')
      .addToUi();
}

function viewChart() {

  var html = HtmlService
  .createTemplateFromFile("Index")
  .evaluate()
  .setTitle("Test Chart")
  .setHeight(450)
  .setWidth(750)
  .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  
  SpreadsheetApp.getUi().showModelessDialog(html, "Translation Proofreading Trend Chart")
}


function getPivot(translator_type) {
  var months = {0: "Jan",
                1: "Feb",
                2: "Mar",
                3: "Apr",
                4: "May",
                5: "Jun",
                6: "Jul",
                7: "Aug",
                8: "Sep",
                9: "Oct",
                10: "Nov",
                11: "Dec"}
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var pivot_sheet = ss.getSheetByName("Query");
  pivot_sheet.clear();
  
  //Set the query string depending on whether in house, freelance, all translators, or a specific translator are requested.
  var query_cell = pivot_sheet.getRange(1, 1);
  var individual;
  if (translator_type == "In House") {
    individual = false;
    query_cell.setValue("=QUERY('Case Database'!A:AT, \"select A, avg(AT) where AR = 'No' and AT != 999 group by A pivot H\")");
  }
  else if (translator_type == "Freelance") {
    individual = false;
    query_cell.setValue("=QUERY('Case Database'!A:AT, \"select A, avg(AT) where AR = 'Yes' and AT != 999 group by A pivot H\")");
  }
  else if (translator_type == "All") {
    individual = false;
    query_cell.setValue("=QUERY('Case Database'!A:AT, \"select A, avg(AT) where E != '' and AT != 999 group by A pivot H\")");
  }
  else {
    individual = true;
    query_cell.setValue("=QUERY('Case Database'!A:AT, \"select A, avg(AT) where H = '" + translator_type + "' and AT != 999 group by A pivot H\")");
    pivot_sheet.getRange(1, 3).setValue("=QUERY('Case Database'!A:AT, \"select A, avg(AT) where E != '' and AT != 999 group by A\")");
  }
  
  //Extract the data based on the query request
  var num_months = pivot_sheet.getLastRow()
  var num_translators = pivot_sheet.getLastColumn();
  var data = pivot_sheet.getRange(1, 1, num_months, num_translators).getValues();
  var formatted_data = []
  
  //Format the data for use in google.visualization.arrayToDataTable()
  var labels = [{label: 'Month', id: 'Month'}];
  
  if (individual) {
    labels.push({label: data[0][1], id: data[0][1], type: 'number'});
    labels.push({label: data[0][3], id: data[0][3], type: 'number'});
    //Ensure that the team average and individual months corespond. 
    //Adds a null entry for the individual id they have no scores for a month with team scores.
    var data_table = [labels];
    var translator_months = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] != "") {
        translator_months.push(months[data[i][0].getMonth()]+" "+data[i][0].getFullYear());
      }
    }
    for (var i = 1; i < data.length; i++) {
      var month = months[data[i][2].getMonth()]+" "+data[i][2].getFullYear();
      if (translator_months.indexOf(month) == -1) {
        formatted_data[i] = [data[i][2], null, data[i][3]];
      }
      else {
        var month_index = translator_months.indexOf(month);
        formatted_data[i] = [data[i][2], data[month_index+1][1], data[i][3]];
      }
      formatted_data[i][0] = months[formatted_data[i][0].getMonth()]+" "+formatted_data[i][0].getFullYear();
      for (var j = 1; j < data[i].length; j++) {
        if (formatted_data[i][j] == "") {
          formatted_data[i][j] = null;
        }
      }
      data_table.push(formatted_data[i]);
    }
    
  }
  else {
    for (var i = 1; i < data[0].length; i++) {
      labels.push({label: data[0][i], id: data[0][i], type: 'number'});
    }
    var data_table = [labels];
    for (var i = 1; i < data.length; i++) {
      data[i][0] = months[data[i][0].getMonth()]+" "+data[i][0].getFullYear();
      for (var j = 1; j < data[i].length; j++) {
        if (data[i][j] == "") {
          data[i][j] = null;
        }
      }
      data_table.push(data[i]);
    }
  }
  
  return data_table
}
