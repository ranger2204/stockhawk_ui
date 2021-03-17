import { Component, OnInit, Inject } from '@angular/core';
import { PortfolioService } from '../../services/portfolio.service';
import { StockService } from '../../services/stock.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as Highcharts from 'highcharts';
import { Investment } from '../../models/Investment'

@Component({
  selector: 'app-virtual-market',
  templateUrl: './virtual-market.component.html',
  styleUrls: ['./virtual-market.component.sass']
})
export class VirtualMarketComponent implements OnInit {

  portfolios = [];
  historyLB = 30;

  activePortfolio = undefined;
  portfolioDetails = undefined;
  investmentDetails = [];
  

  stockDetails = [];
  dealDetails = [];
  divDetails = [];
  agmDetails = [];
  bmDetails = [];
  insDetails = [];
  brDetails = [];
  newsDetails = [];

  stockAutoCompleteList = [];
  stockAutoCompleteTO = undefined;
  displayedColumnsPortfolio = ['stock_name', 'quantity', 'perSharePriceCost', 'perSharePriceCurrent', 'cost', 'market_value', 'pL', 'change', '5yfd', 'remarks', 'action']
  displayedColumnsDeals = ['dealStock', 'dealType', 'dealTitle', 'dealTransType', 'dealQty', 'dealPrice']
  stockPriceHistory = {}

  currentPFStockValue = []
  refreshInProgress = false;
  currentProgress = 0;


  constructor(
    private portfolioService: PortfolioService,
    private stockService: StockService,
    private newInvestment: Investment,
    public dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.getLatestPFs()
  }

  getLatestPFs() {
    this.portfolioService.getAllPortfolios().subscribe(data => {
      this.portfolios = data['portfolios'];
      console.log(this.portfolios);
    })
  }

  getLen(objList){
    return objList.length
  }

  getProfitOnly(){
    let total = 0
    for(let inv of this.investmentDetails){
      let stk_obj = this.getStockFromId(inv.inv_stock_id)
      if(inv.inv_stock_cost_price < stk_obj.stock_latest_price){
        total += (stk_obj.stock_latest_price - inv.inv_stock_cost_price) * inv.inv_stock_qty
      }
    }
    return Number(total.toFixed(2))
  }

  changePortfolio(portfolioId) {
    if (!isNaN(portfolioId)) {
      this.activePortfolio = parseInt(portfolioId);
      console.log(`Portfolio changed to ${this.activePortfolio}`);

      this.portfolioService.getPortfolioById(this.activePortfolio).subscribe(data => {
        // console.log(data)
        this.portfolioDetails = data['portfolio']
        this.stockDetails = data['stocks']
        this.investmentDetails = this.aggInvestment(data['investments']);
        // console.table(this.investmentDetails)
        // console.table(this.stockDetails)
        this.getPriceHistoryForPortfolio(this.activePortfolio, this.historyLB);
        this.getDeals();
        this.getDividends();
        this.getAGM();
        this.getBM();
        this.getInsider();
        this.getBrokRes();
        this.getNews();

        
      })
    }
  }


  removeAPF() {
    this.portfolioService.removePortfolioById(this.activePortfolio).subscribe(data => {
      console.log("Delete Successful!")
      this.getLatestPFs()
      this.portfolioDetails = undefined;
    })
  }

  getHeader(jsonArray: Array<any>) {
    if (jsonArray.length > 0) {
      let headers = Object.keys(jsonArray[0])
      console.log(headers)
      let cleanHeader = []
      headers.forEach(element => {
        if (element[0] != '_') {

          let cheader = element.replace('_', ' ')
          cleanHeader.push(cheader)
        }
      });
      console.log(cleanHeader)
      return cleanHeader
    }
  }

  roundFloat(floatValue: Number) {

    return Number((floatValue).toFixed(2)).toLocaleString();
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

  split(sepString: string, sep=','){
    if(sepString === null)
      return []

    // console.log(sepString.split(sep))
    return sepString.split(sep)
  }

  trim(tag:string){
    return tag.trim()
  }

  addInvestment() {
    // console.log(this.newInvestment)
    this.portfolioService.addNewInvestment(this.activePortfolio, this.newInvestment).subscribe(data => {
      console.log(`Investment ID :${data['investment_id']}`)
      this.changePortfolio(this.activePortfolio)
    })
  }

  sellInvestment(investmentId) {
    this.portfolioService.sellInvestment(investmentId).subscribe(data => {
      console.log(`Investment ID :${data['investment_id']}`)
      this.changePortfolio(this.activePortfolio)
    })
  }

  aggInvestment(investmentDetails){
    let investments = [];

    let updateInvestment = (list, inv) => {
      for(let i=0; i<list.length; i++){
        if(list[i].inv_stock_id == inv.inv_stock_id){
          list[i].inv_id = inv.inv_id;
          list[i].inv_stock_cost_price = (inv.inv_stock_cost_price*inv.inv_stock_qty + list[i].inv_stock_cost_price*list[i].inv_stock_qty)/(list[i].inv_stock_qty + inv.inv_stock_qty);
          list[i].inv_stock_qty = list[i].inv_stock_qty + inv.inv_stock_qty;
          list[i].inv_remarks = inv.inv_remarks
          return list
        }
      }
      list.push(inv)
      return list
    }

    for(let i=0; i<investmentDetails.length; i++){
      let inv = investmentDetails[i]
      investments = updateInvestment(investments, inv)
    }
    return investments
  }

  removeInvestment(investmentId) {
    this.portfolioService.removeInvestment(investmentId).subscribe(data => {
      console.log(`Investment ID :${data['investment_id']}`)
      this.changePortfolio(this.activePortfolio)
    })
  }

  openAddNewPFDialog() {
    const dialogRef = this.dialog.open(DialogNewPF, {
      data: { portfolioName: "" }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.getLatestPFs()
    });
  }

  getStockFromId(stockId){
    // console.table(this.stockDetails)
    for(let stock of this.stockDetails)
      if(stock.stock_id == stockId)
        return stock
  }
    
  updateStockDetails(){
    this.refreshInProgress = true;
    this.stockService.updateStockDetails(this.stockDetails).subscribe(data =>{
      this.changePortfolio(this.activePortfolio)
      this.refreshInProgress = false;
    },
    error => {
      this.refreshInProgress = false;
      console.log(`Error : ${error}`)
    });
  }

  getRandomColors(inColors: Array<string>){
    var letters = '0123456789ABCDEF';
    var color = '#';
    
    while(true){
      for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      if(inColors.indexOf(color) == -1)
        return color;
      color = '#';
    }
  }

  getBrokRes(){
    this.brDetails = []
    if(this.stockDetails.length > 0)
      this.stockService.getBrokResforStocks(this.stockDetails).subscribe(data => {
        // console.table(data['deals'])
        this.brDetails = data['broker-research']
      })
  }

  getAGM(){
    this.agmDetails = []
    if(this.stockDetails.length > 0)
      this.stockService.getAGMforStocks(this.stockDetails).subscribe(data => {
        // console.table(data['deals'])
        this.agmDetails = data['agm']
      })
  }

  getNews(){
    this.newsDetails = []
    if(this.stockDetails.length > 0)
      this.stockService.getNewsforStocks(this.stockDetails).subscribe(data => {
        // console.table(data['deals'])
        this.newsDetails = data['news']
      })
  }

  getDeals(){
    this.dealDetails = []
    if(this.stockDetails.length > 0)
      this.stockService.getDealsforStocks(this.stockDetails).subscribe(data => {
        // console.table(data['deals'])
        this.dealDetails = data['deals']

      })
  }

  getInsider(){
    this.insDetails = []
    if(this.stockDetails.length > 0)
      this.stockService.getInsforStocks(this.stockDetails).subscribe(data => {
        // console.table(data['deals'])
        this.insDetails = data['insider']
      })
  }

  getBM(){
    this.bmDetails = []
    if(this.stockDetails.length > 0)
      this.stockService.getBMforStocks(this.stockDetails).subscribe(data => {
        // console.table(data['deals'])
        this.bmDetails = data['bm']
      })
  }

  getDividends(){
    this.divDetails = []
    if(this.stockDetails.length > 0)
      this.stockService.getDividendForStocks(this.stockDetails).subscribe(data => {
        // console.table(data['dividends'])
        this.divDetails = data['dividends']
      })
  }

  changePriceHistory(lookBack){
    this.historyLB = lookBack;
    this.getPriceHistoryForPortfolio(this.activePortfolio, lookBack);
  }

  getPriceHistoryForPortfolio(portfolioId, lookBack=30) {
    this.portfolioService.getPriceHistoryForPortfolio(portfolioId, lookBack).subscribe(data => {
      let priceHistory: any = data['price_history'];
      // console.log(priceHistory)
      let stockIds = Object.keys(priceHistory)
      stockIds.forEach(stockId => {
        this.stockPriceHistory[stockId] = priceHistory[stockId]
      })
      this.currentPFStockValue = []
      let inColors = []
      // let firstSelected = true;
      let totalLive = [];
      let totalFixed = [];

      let updateTotal = (list, date, value) => {
        for(let i=0; i<list.length; i++){
          if(list[i][0] == date){
            list[i][1] += value
            return list
          }
        }
        
        list.push([date, value])
        return  list
      }

      this.investmentDetails.forEach((investment, index) => {
        let dataLive = []
        let dataFixed = []
        this.stockPriceHistory[investment.inv_stock_id].forEach(ph => {
          dataLive.push(
            [
              Date.parse(ph.stock_price_date),
              investment.inv_stock_qty * ph.stock_price_close,
              // investment.inv_stock_qty * investment.inv_stock_cost_per_share
            ]
          )
          dataFixed.push(
            [
              Date.parse(ph.stock_price_date),
              investment.inv_stock_qty * investment.inv_stock_cost_price
            ]
          )
          
          totalFixed = updateTotal(
            totalFixed, Date.parse(ph.stock_price_date), 
            investment.inv_stock_qty * investment.inv_stock_cost_price
          )

          totalLive = updateTotal(
            totalLive, Date.parse(ph.stock_price_date), 
            investment.inv_stock_qty * ph.stock_price_close
          )

        });

        let color = this.getRandomColors(inColors)
        inColors.push(color)
        this.currentPFStockValue.push({
          'name': this.getStockFromId(investment.inv_stock_id).stock_name,
          'data': dataLive,
          'color': color,
          // 'visible': firstSelected?true:false
          'visible': false
        })

        this.currentPFStockValue.push({
          'name': this.getStockFromId(investment.inv_stock_id).stock_name+' (Cost)',
          'showInLegend': false,  
          'data': dataFixed,
          'color': color,
          'dashStyle': 'Dot',
          'linkedTo': ':previous',
          // 'visible': firstSelected?true:false
          'visible': false
        })
        // firstSelected = false;

      });

      let color = this.getRandomColors(inColors)
      this.currentPFStockValue.push({
        'name': 'Total',
        'data': totalLive,
        'color': color,
      })

      this.currentPFStockValue.push({
        'name': 'Total (Cost)',
        'data': totalFixed,
        'color': color,
        'linkedTo': ':previous',
        'dashStyle': 'Dot'
      })

      this.drawPortfolioTrend()

    })
  }

  calculateCI(startPrice, years=5, rate=10){
    return Math.round(startPrice*Math.pow((1+rate/100), years) - startPrice).toLocaleString();
  }

  updateAllStocks(){
    this.refreshInProgress = true;

    this.stockService.getAllStocksDetails().subscribe( async data => {
      let stocks = data['stocks'];
      // console.table(stocks)
      let stockChunk = []
      let chunkSize = 10
      let currentChunkIndex = 0

      for(let stock of stocks){
        stockChunk.push(stock)
        if(stockChunk.length == chunkSize){
          await this.stockService.updateStockDetails(stockChunk).toPromise();
          stockChunk = []
          currentChunkIndex += 1
          this.currentProgress = currentChunkIndex * 100 / (stocks.length/chunkSize)
        }
      }

      if(stockChunk.length > 0){
        await this.stockService.updateStockDetails(stockChunk).toPromise();
      }

      this.refreshInProgress = false
    },
    error => {
      this.refreshInProgress = false;
      console.log(`Error : ${error}`)
    })
  }

  toLocalString(value: Number){
    return value.toLocaleString()
  }

  drawPortfolioTrend() {

    // console.log(this.currentPFStockValue)
    let chartOptions = {
      title: {
        text: 'Portfolio Trend'
      },

      xAxis: {
        'type': 'datetime',
        title: {
          text: 'Date'
        }
      },

      yAxis: {
        title: {
          text: 'Value'
        }
      },

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

      series: this.currentPFStockValue
    }
  
    Highcharts.chart('portfolio-trend', chartOptions as Highcharts.Options)
  }
}

export interface DialogData {
  portfolioName: string;
}

@Component({
  selector: 'dialog-new-pf',
  templateUrl: 'dialog-new-pf.html',
})
export class DialogNewPF {

  constructor(
    public dialogRef: MatDialogRef<DialogNewPF>,
    private portfolioService: PortfolioService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

  addNewPF(portfolioName) {
    this.portfolioService.addNewPortfolio(this.data.portfolioName).subscribe(data => {
      console.log(data)
    })
  }

}