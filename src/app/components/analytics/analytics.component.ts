import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {FormControl} from '@angular/forms';
import { StockService } from '../../services/stock.service';
import * as Highcharts from 'highcharts';
import { ObjectUnsubscribedError } from 'rxjs';

export class Stock{
  stock_name: string = "";
  stock_category: string = "";
  stock_id: number = undefined;

  constructor(){}
}
@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.sass']
})
export class AnalyticsComponent implements OnInit {

  stockAutoCompleteList = []
  stockAutoCompleteTO = undefined;

  agmDetails = []
  dealDetails = []
  divDetails = []
  bmDetails = []
  insDetails = []
  topMFStocks = []
  newsDetails = []
  quarterDetails = []
  competitionDetails = [];
  brDetails = [];

  equityMetric = "latest"

  refreshInProgress = false

  currentStock: Stock;
  priceHistory = [];
  currentProgress = 0;
  
  
  allSectors = [];
  selectedSectors = [];
  TOP_N = 30;

  
  @ViewChild('selectedOptions') selectedOptions;
  // selectedSectors = []

  sectorKW = "";
  eventKW = "";

  historyLB = 30;
  allStocks = []

  displayedColumns = {
    'deals': [
      'stockName', 'dealType', 'dealTransType', 'dealTitle','dealPrice', 'dealQty', 'dealDate'
    ],
    'dividends': [
      'stockName', 'divType', 'divEffectiveDate', 'divAnnoDate','divRemarks'
    ],
    'agm': [
      'stockName', 'agmPurpose', 'agmDate', 'agmAnnoDate','agmRemarks'
    ],
    'bm': [
      'stockName', 'bmRemarks', 'bmDate'
    ],
    'insider': [
      'stockName', 'name', 'category', 'transactionDate', 'qty', 'price', 'action', 'mode', 'holding'
    ],
    'br': [
      'stockName', 'organization', 'flag', 'recDate', 'curPrice', 'recPrice', 'targetPrice', 'margin'
    ],
    'news': [
      'stockName', 'newsDate', 'newsHead'
    ]
  }

  valuePicks = {}
  commonStocks = new Set()

  constructor(
    private stockService: StockService,
  ) { }

  ngOnInit(): void {
    this.currentStock = new Stock()
    this.getAllStocks()
    this.getSectors()
  }

  getCommonStocks(){

    Object.keys(this.valuePicks).forEach(item => {
      if(this.commonStocks.size == 0){
        this.commonStocks = new Set(this.commonStocks[item])
      }
      else{
        this.commonStocks = new Set(
          [...this.valuePicks[item]].filter(x => this.commonStocks.has(x))
        )
      }
    })
  }


  updateAllStocks(){
    this.refreshInProgress = true;

    this.stockService.getAllStocksDetails().subscribe( async data => {
      let stocks = data['stocks'];
      console.table(stocks.length)
      let stockChunk = []
      let chunkSize = 10
      let currentChunkIndex = 0

      for(let stock of stocks){
        stockChunk.push(stock)
        
        if(stockChunk.length == chunkSize){
          try {
            await this.stockService.updateStockDetails(stockChunk).toPromise();
          } catch (error) {
            //pass
          } finally{
            stockChunk = []
            currentChunkIndex += 1
            this.currentProgress = currentChunkIndex * 100 / (stocks.length/chunkSize)
          }
          
        }
      }

      if(stockChunk.length > 0){
        await this.stockService.updateStockDetails(stockChunk).toPromise();
      }

      this.refreshInProgress = false
      this.getAllStocks()
    },
    error => {
      this.refreshInProgress = false;
      console.log(`Error : ${error}`)
    })
  }

  getSectors(){
    this.stockService.getAllSectors().subscribe(data => {
      console.log(data)
      this.allSectors = data['sector']
    })
  }

  getDistribution(dataArray, actionKey="deal_trans_type", eqKey="deal_stock_id"){
    let detailTypeSec = {}

    for(let i=0; i<dataArray.length; i++){
      let detail = dataArray[i]
      if(Object.keys(detailTypeSec).indexOf(detail[actionKey]) == -1){
        detailTypeSec[detail[actionKey]] = {}
      }
      if(Object.keys(detailTypeSec[detail[actionKey]]).indexOf(detail[eqKey]) == -1){
        detailTypeSec[detail[actionKey]][detail[eqKey]] = 0
      }
    }

    for(let i=0; i<dataArray.length; i++){
      let detail = dataArray[i]
      // console.log(detail[eqKey])
      detailTypeSec[detail[actionKey]][detail[eqKey]] = detailTypeSec[detail[actionKey]][detail[eqKey]] + 1

    }
    return detailTypeSec

  }

  checkInSelection(sector){
    if(this.selectedSectors.indexOf(sector) != -1)
      return true
    return false
  }

  removeSector(sector){
    let index = this.selectedSectors.indexOf(sector)
    this.selectedSectors.splice(index, 1)
    console.log(this.selectedSectors)
    // this.getStocksBySector(this.selectedSectors)
  }

  allSectorSelection(){
    this.selectedOptions.selectAll();
    this.selectedSectors = this.allSectors
    this.getStocksBySector()
  }

  resetSectorSelection(){
    this.selectedOptions.deselectAll()
    this.selectedSectors = []
    this.getStocksBySector()

  }

  updateSectorSelection(event){

    let index = this.selectedSectors.indexOf(event.target.parentNode.innerText)
    if( index == -1){
      this.selectedSectors.push(event.target.parentNode.innerText)
    }
    else{
      this.selectedSectors.splice(index, 1)
    }
    console.log(this.selectedSectors)
    this.getStocksBySector()
  }

  getStockList(event) {
    
    let stockName = event.target.value
    if (this.stockAutoCompleteTO != undefined) {
      clearTimeout(this.stockAutoCompleteTO)
    }

    this.stockAutoCompleteTO = setTimeout(() =>
      this.stockService.getStockByName(stockName).subscribe(data => {
        this.stockAutoCompleteList = data['stocks']
      }),
      5
    )
  }

  setStock(stockName){
    this.stockService.getStockByName(stockName).subscribe(data => {
      this.stockAutoCompleteList = data['stocks']
      this.currentStock = this.stockAutoCompleteList[0]
      this.getAnalytics();
    })
  }

  changePriceHistory(lookBack){
    this.historyLB = lookBack;
    if(this.currentStock != undefined)
      this.getPriceHistory()
  }

  getAnalytics(){
      this.getPriceHistory()
      this.getQuarterly();
      this.getCompetition();

  }

  getPriceHistory(){
    this.stockService.getPriceHistory(this.currentStock, this.historyLB).subscribe(data => {
      
      let prices = []
      let volumes = []
      let maxVolume = 0;

      // console.table(data['price_history'])

      data['price_history'].forEach(item => {
        prices.push(
          [
            Date.parse(item.stock_price_date),
            item.stock_price_close
          ]
        )
        volumes.push(
          [
            Date.parse(item.stock_price_date),
            item.stock_price_volume
          ]
        )

        if(maxVolume < item.stock_price_volume)
          maxVolume = item.stock_price_volume
      });

      let priceVolume = [{
        'name': 'Price',
        'data': prices
        
      },{
        'name': 'Volume',
        'data': volumes,
        'type': 'column',
        'yAxis': 1,
        'pointWidth': Math.max(1, 240.0/volumes.length)
      }
    ]
      this.drawPriceHistory(priceVolume, maxVolume, this.currentStock.stock_name);
    });
  }

  async getStocksBySector(){

    let sectors = this.selectedSectors
    let stocks = []
    for(let i=0;i<sectors.length;i++){
      let item = sectors[i]
      try{
        let sdata = await this.stockService.getStocksBySector([item]).toPromise()
        // console.log(sdata)
        stocks = stocks.concat(sdata['stocks'])
      }
      catch(error){
        // console.log(error)
      }
    } 
    this.getPopulateCD(stocks, 'multiple', 'sectors')
  }


  getMean(list=[], key='qrtr_net_profit'){
    let mean = 0;
    list.forEach(data => {
      mean += data[key]
    })
    return mean/list.length
  }

  async getPopulateCD(competition, category, divElement="competition"){

    let competitionDetails = []
    for(let i=0; i<competition.length;i++){
      let item = competition[i]
      try{
        let qdata = await this.stockService.getQuaterlyForStocks([item]).toPromise()
        // console.log(qdata['quarterly'])
        let metric = 0
        if(this.equityMetric == 'mean')
          metric = this.getMean(qdata['quarterly'], 'qrtr_net_profit')
        else
          metric = parseFloat(qdata['quarterly'][0]['qrtr_net_profit'])
        // console.log(`${item.stock_name} : ${lastQtrProfit}`)
        competitionDetails.push({
          'name': item.stock_name,
          'data': [[item.stock_current_price, metric]]
        })

      }
      catch(error){
        // console.log(error)
      }
    }
    this.drawCompetition(competitionDetails, category, divElement)

  }

  getCompetition(){
    this.stockService.getCompetitionForStocks([this.currentStock]).subscribe(data => {
      console.log(data)
      this.competitionDetails = []
      this.getPopulateCD(data['competition'], this.currentStock.stock_category)

    })
  }

  async getQuarterly(){
    let qdata = await this.stockService.getQuaterlyForStocks([this.currentStock]).toPromise()
    let divdata = await this.stockService.getDividendForStocks([this.currentStock], 1000).toPromise()

    console.log(qdata)
    console.log(divdata)
      // if(this.currentStock.stock_category.indexOf('bank') != -1){
    let series = {
      'profit': [],
      'income': [],
      'dividend': []
    }

    qdata['quarterly'].forEach( item => {
      series['profit'].push([Date.parse(item.qrtr_date), item.qrtr_net_profit])
      series['income'].push([Date.parse(item.qrtr_date), item.qrtr_total_income])
    })

    divdata['dividends'].forEach( item => {
      series['dividend'].push([Date.parse(item.div_eff_date), Number.parseFloat(item.div_perc)])
    })



    this.quarterDetails = [
      {
        'name': 'Profit',
        'data': series['profit'],
        // 'yAxis': 1,
        // 'type': 'column',
      },
      {
        'name': 'Income',
        'data': series['income'],
        // 'yAxis': 0,
      },
      {
        'name': 'Dividend',
        'data': series['dividend'],
        // 'yAxis': 2,
        // 'type': 'column',
      },
      
    ]

    this.drawBankQuarter()

  }

  changeMetric(){
    console.log(`Metric : ${this.equityMetric}`)
    if(this.currentStock.stock_name.length != 0)
      this.getCompetition()
  }

  getMatchingDetails(list, id, key){
    let details = []
    list.forEach(item => {
      if(item[key] == id)
        details.push(item)
    });
    return details
  }
  getUniqueStockNamefromList(list=[], key="deal_stock_id"){
    let stockIds = []
    list.forEach(item => {
      if(stockIds.indexOf(item[key]) == -1)
        stockIds.push(item[key])
    })
    return stockIds
  }

  getLen(objList){
    return objList.length
  }

  getAGM(){
    this.dealDetails = []

    this.stockService.getAGMforStocks().subscribe(data => {
      // console.table(data['deals'])
      this.agmDetails = data['agm']
    })
  }

  getNews(){
    this.dealDetails = []

    this.stockService.getNewsforStocks().subscribe(data => {
      // console.table(data['deals'])
      this.newsDetails = data['news']
    })
  }

  getDeals(){
    this.dealDetails = []

    this.stockService.getDealsforStocks().subscribe(data => {
      // console.table(data['deals'])
      this.dealDetails = data['deals']
      let dealCounts = this.getDistribution(this.dealDetails)
      
      // console.log(dealCounts)
      let dataSeries = []
      Object.keys(dealCounts['Purchase']).forEach(it => {
        let stockObj = this.getStockFromId(it)
        dataSeries.push(
          {
            'name': `${stockObj.stock_name}`,
            'data': [dealCounts['Purchase'][it]],
            'type': 'column',
            // 'hidden': true
          }
        )
      })
      
      dataSeries.sort((a, b) => {
        return b.data[0] - a.data[0]
      })

      let top_items = dataSeries.splice(0, this.TOP_N)

      this.commonStocks['deals'] = []
      top_items.forEach(item => {
        this.commonStocks['deals'].push(
          item.name
        )
      })


      this.drawDistribution('deals-distribution-buy', 'Deals-Purchase', top_items)

    })
  }

  getIns(){
    this.dealDetails = []

    this.stockService.getInsforStocks().subscribe(data => {
      // console.table(data['deals'])
      this.insDetails = data['insider']
    })
  }

  getBM(){
    this.bmDetails = []
   
    this.stockService.getBMforStocks().subscribe(data => {
      // console.table(data['deals'])
      this.bmDetails = data['bm']
    })
  }

  getTopMFHoldings(){
    this.topMFStocks = []
    this.stockService.getTopMFHoldings().subscribe(data => {
      console.log(data)
      this.topMFStocks = data['topmfholdings']
      let dataSeries = []
      this.topMFStocks.forEach(item => {
        dataSeries.push({
          'name': this.getStockFromId(item[0]).stock_name,
          'data': [item[1]]
        })
      })
      let top_items = dataSeries.splice(0, this.TOP_N)

      this.valuePicks['topmfholdings'] = []
      top_items.forEach(item => {
        this.valuePicks['topmfholdings'].push(
          item.name
        )
      })

      this.drawDistribution('top-mf-holdings', 'TOP MF HELD STOCKS - #MFS', top_items)

    })

  }

  getBrokRes(){
    this.brDetails = []

    this.stockService.getBrokResforStocks().subscribe(data => {
      // console.table(data['dividends'])
      this.brDetails = data['broker-research']
      let brCounts = this.getDistribution(this.brDetails, 'brokres_rec_flag', 'brokres_stock_id')
      
      // console.log(brCounts)
      let dataSeries = []
      Object.keys(brCounts['BUY']).forEach(it => {
        dataSeries.push(
          {
            'name': this.getStockFromId(it).stock_name,
            'data': [brCounts['BUY'][it]],
            'type': 'column',
            // 'hidden': true
          }
        )
      })
      
      dataSeries.sort((a, b) => {
        return b.data[0] - a.data[0]
      })

      let top_items = dataSeries.splice(0, this.TOP_N)

      this.valuePicks['broker-research'] = []
      top_items.forEach(item => {
        this.valuePicks['broker-research'].push(
          item.name
        )
      })

      this.drawDistribution('br-distribution-buy', 'BR-BUY', top_items)

    })
  }

  getDividends(){
    this.divDetails = []

    this.stockService.getDividendForStocks().subscribe(data => {
      // console.table(data['dividends'])
      this.divDetails = data['dividends']
    })
  }

  getFloatFromLocale(numStr){
    return parseFloat(numStr.replace(',', ''))
  }

  roundFloat(floatValue: Number) {
    return Number((floatValue).toFixed(2)).toLocaleString();
  }

  getStockFromId(stockId){
    for(let i=0;i<this.allStocks.length;i++){
      let stock = this.allStocks[i]
      if(stock.stock_id == stockId)
        return stock
    }
    return {
      'stock_name': ""
    }
  }

  getAllStocks(){
    this.allStocks = []
    this.stockService.getAllStocksDetails().subscribe(data => {
      this.allStocks = data['stocks']
      this.getBrokRes();
      this.getIns();
      this.getAGM();
      this.getBM();
      this.getDeals();
      this.getDividends();
      this.getTopMFHoldings();
      this.getNews();

    })
  }

  drawCompetition(competitionData, category="MISC", divElement='competition'){
    // console.log(competitionData)
    let chartOptions = {
      chart: {
        type: 'scatter',
        zoomType: 'xy'
      },
      title: {
        text: 'Competition : '+category
      },

      xAxis: {
        'type': 'number',
        title: {
          text: 'Price'
        }
      },

      yAxis: { // Secondary yAxis
          gridLineWidth: 0,
          title: {
              text: 'Profit',
              style: {
                  color: Highcharts.getOptions().colors[0]
              }
          },
          labels: {
            format: '{value} Cr',
            style: {
                color: Highcharts.getOptions().colors[0]
            }
          },
      },

      plotOptions: {
        scatter: {
            marker: {
                radius: 5,
                states: {
                    hover: {
                        enabled: true,
                        lineColor: 'rgb(100,100,100)'
                    }
                }
            },
            states: {
                hover: {
                    marker: {
                        enabled: false
                    }
                }
            },
            tooltip: {
                headerFormat: '<b>{series.name}</b><br>',
                pointFormat: 'Profit {point.y} Cr, Price Rs.{point.x}'
            }
        }
    },

      tooltip: {
        shared: true,
        crosshairs: true
      },

      series: competitionData
    }
  
    Highcharts.chart(divElement, chartOptions as Highcharts.Options)

  }


  drawBankQuarter(){
    let chartOptions = {
      title: {
        text: 'Quarter Trend'
      },

      xAxis: {
        'type': 'datetime',
        title: {
          text: 'Date'
        }
      },

      yAxis: [{ // Secondary yAxis
          gridLineWidth: 0,
          title: {
              text: 'Profit',
              style: {
                  color: Highcharts.getOptions().colors[0]
              }
          },
          labels: {
            format: '{value} Cr',
            style: {
                color: Highcharts.getOptions().colors[0]
            }
          },
      }, { // Primary yAxis
        title: {
            text: 'Income',
            style: {
                color: Highcharts.getOptions().colors[1]
            }
        },
        labels: {
          format: '{value} Cr',
          style: {
              color: Highcharts.getOptions().colors[1]
          }
        },
        // opposite: true
      // }],
      }, { // Secondary yAxis
        gridLineWidth: 0,
        title: {
            text: 'Dividend',
            style: {
                color: Highcharts.getOptions().colors[2]
            }
        },
        labels: {
          format: '{value} %',
          style: {
              color: Highcharts.getOptions().colors[2]
          }
        },
        opposite: true,
        // max: 2000,
        // min: 0
    }],

      plotOptions: {
        series: {
            marker: {
                enabled: true
            },
            // showCheckbox: true
        }
      },

      tooltip: {
        shared: true,
        crosshairs: true
      },

      series: this.quarterDetails
    }
  
    Highcharts.chart('bank-quarter', chartOptions as Highcharts.Options)

  }

  drawDistribution(divId="deals-distribution", distName="Top Deals", dataSeries=[]) {

    let stocks = []
    let data = []
    dataSeries.forEach(it => {
      stocks.push(it.name)
      data.push(it.data[0])
    })

    // console.log(stocks)

    let stockChange = (event) => {
      this.setStock(event.point.category)
    }

    let chartOptions = {
    chart: {
        type: 'column'
      },
      title: {
        text: distName
      },
      legend: {
          enabled: false
      },
      xAxis: {
        categories: stocks,
        labels: {
          rotation: -90
        }
      },

      yAxis: {
        title: {
          text: 'Count'
        }
      },
    

      plotOptions: {
        series: {
            marker: {
                enabled: true
            },
            events: {
              click: function(event){
                stockChange(event);
              }
            }
          }
            // showCheckbox: true
      },

      series: [{
        'name': distName.split('-')[1],
        'data': data
      }]
    }
  
    Highcharts.chart(divId, chartOptions as Highcharts.Options)
  }

  drawPriceHistory(priceVolume, maxVolume, stockName) {
    let chartOptions = {
      title: {
        text: 'Price Trend - '+stockName
      },

      xAxis: {
        'type': 'datetime',
        title: {
          text: 'Date'
        }
      },

      yAxis: [{
        title: {
          text: 'Value'
        }
      },
      { // Primary yAxis
        title: {
            text: 'Volume',
        },
        opposite: true,
        max: 4*maxVolume
      }],

      plotOptions: {
        series: {
            marker: {
                enabled: true
            },
            // showCheckbox: true
        }
      },

      tooltip: {
        shared: true,
        crosshairs: true
      },

      series: priceVolume
    }
  
    Highcharts.chart('price-history', chartOptions as Highcharts.Options)
  }
}

