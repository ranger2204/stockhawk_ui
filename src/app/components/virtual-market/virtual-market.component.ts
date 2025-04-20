import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { PortfolioService } from '../../services/portfolio.service';
import { StockService } from '../../services/stock.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as Highcharts from 'highcharts';
import { Investment } from '../../models/Investment'
import { Alert } from '../../models/Alert'
import { ChangeDetectorRef } from '@angular/core';
import { FilterPipe } from '../../pipes/filter.pipe'

import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatTabGroup } from '@angular/material/tabs/tab-group';
import { ThrowStmt } from '@angular/compiler';
import {MatSort, SortDirection} from '@angular/material/sort';
import { MatTable } from '@angular/material/table';
import { Todo } from 'src/app/models/Todo';



@Component({
  selector: 'app-virtual-market',
  templateUrl: './virtual-market.component.html',
  styleUrls: ['./virtual-market.component.sass'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class VirtualMarketComponent implements OnInit {

  portfolios = [];
  historyLB = 90;
  priceType = "stock_price_close"
  expandedStockId = -1;
  liveTrack = false;
  blink = false
  fileToUpload = {};

  activePortfolio = null;
  portfolioDetails = null;
  portfolioStats = null;
  portfolioInvestments = null;
  investmentDetails = [];
  sellDetails = [];
  filterPipe = null;

  newAlert = new Alert()
  newTodo = new Todo()
  
  todoStockFilter = ""

  stockDetails = [];
  dealDetails = [];
  divDetails = [];
  agmDetails = [];
  bmDetails = [];
  insDetails = [];
  brDetails = [];
  newsDetails = [];
  alertData = [];
  todoData = [];

  allStocks = [];

  expProfit = "0";
  perStockSellPrice = 0;
  stockQty = "0";
  taxPerc = "10";
  perStockCostPrice = 0

 
 
  hTable: MatTable<any>;
  @ViewChild('hTable') set setHTable(table: MatTable<any>){
    if(this.portfolioDetails != null){
        console.log(table)
        this.hTable = table
    }
  }

  shTable: MatTable<any>;
  @ViewChild('shTable') set setSHTable(table: MatTable<any>){
    if(this.portfolioDetails != null){
        console.log(table)
        this.shTable = table
    }
  }

  stockAutoCompleteList = [];
  stockAutoCompleteTO = null;
  displayedColumnsInner = [
    'price','qty', 'cost', 'date', 'cprice', 'profit', 'action'
  ]
  displayedColumnsPortfolio = [
    'stock_name', 
    // 'stock_sector', 
    'quantity', 'perShareCostPrice', 
    'perShareCurrentPrice', 'perShareLivePrice', 'perShareLivePriceDiff', 'daysChange', 'cost', 
    'market_value', 'pL', 'change', '5yfd', 'perShareProjectedPrice', 'perShareProjectedPerc', 'pPL', 'cagr', 'action'
  ]

  displayedColumnsSellHistory = [
    'stock_name', 'stock_sector', 'date',
    'quantity', 'cost', 'perShareCurrentPrice', 'perShareCostPrice', 'totalSellPrice', 'pL', 'MpL'
    // 'perShareLivePrice', 'perShareLivePriceDiff', 
    // 'market_value', 'change', '5yfd', 'perShareProjectedPrice', 'perShareProjectedPerc', 'pPL', 'action'
  ]

  alertColumns = [
    'Stock', 'Type', 'CurrentPrice', 'Value', 'CreatedTime',
    'Action'
  ]

  todoColumns = [
    'Stock', 'StartPrice', 'ActionType', 'Reason', 'CreatedTime',
    'Action'
  ]

  displayedColumnsDeals = ['dealStock', 'dealType', 'dealTitle', 'dealTransType', 'dealQty', 'dealPrice']
  stockPriceHistory = {}

  displayedColumns = {
    'deals': [
      'stockName', 'curPrice', 'dealType', 'dealTransType', 'dealTitle','dealPrice', 'dealQty', 'dealDate'
    ],
    'dividends': [
      'stockName', 'curPrice', 'divType', 'divEffectiveDate', 'divAnnoDate','divRemarks'
    ],
    'agm': [
      'stockName', 'curPrice', 'agmPurpose', 'agmDate', 'agmAnnoDate','agmRemarks'
    ],
    'bm': [
      'stockName', 'curPrice', 'bmRemarks', 'bmDate'
    ],
    'insider': [
      'stockName', 'name', 'category', 'transactionDate', 'qty', 'curPrice','price', 'action', 'mode', 'holding'
    ],
    'br': [
      'stockName', 'organization', 'flag', 'recDate', 'curPrice', 'recPrice', 'targetPrice', 'margin'
    ],
    'news': [
      'stockName', 'curPrice', 'newsDate', 'newsHead'
    ]
  }

  currentStockId = null;
  currentPFStockValue = []
  currentLivePFStockValue = []
  currentStockValue = []
  refreshInProgress = false;
  currentProgress = 0;

  liveTrackInterval = null;

  topGainers = []
  topLosers = []

  indices = []

  eventKW = "";

  pagedFiltered = {
    'brDetails': [],
    'insDetails': [],
    'dealDetails': [],
    'agmDetails': [],
    'newsDetails': []
  }

  brokerRatings = []

  @ViewChild("topLeftChart", {static: false}) topLeftChart: MatTabGroup;


  constructor(
    private portfolioService: PortfolioService,
    private stockService: StockService,
    private newInvestment: Investment,
    public dialog: MatDialog,
    private ref: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    let today = new Date()
    this.getLatestPFs()
    this.getAllIndices()
    this.getAllStocks()
    this.getBrokerRatings()
    this.newInvestment.inv_date = (today.getMonth()+1)+'/'+today.getDate()+'/'+today.getFullYear();
    this.filterPipe = new FilterPipe()
  

    // this.changePortfolio(1)
  }

  ngOnDestroy(): void{
    if(this.liveTrackInterval != null)
      clearInterval(this.liveTrackInterval)
  }

  updateExpProfit(xProfit:String, xtaxPerc: String, xstockQty: String){
    let expProfit= Number.parseFloat(xProfit.replace(',',''))
    let stockQty = Number.parseFloat(xstockQty.replace(',',''))
    let taxPerc = Number.parseFloat(xtaxPerc.replace(',',''))

    let inv = undefined
    for(let i=0;i<this.investmentDetails.length;i++){
      if(this.investmentDetails[i].inv_stock_id == this.currentStockId)
      {
        inv = this.investmentDetails[i]
        if(stockQty == -1)
          stockQty = inv.inv_stock_qty
        break
      }
    }

    this.perStockSellPrice = 100*expProfit/(100-taxPerc)
    this.perStockSellPrice /= stockQty
    if(inv != undefined){
      this.perStockSellPrice += inv.inv_stock_cost_price
      this.perStockCostPrice = inv.inv_stock_cost_price
    }
    // console.log(this.perStockSellPrice)
    this.expProfit = this.roundFloat(expProfit)
    this.stockQty = this.roundFloat(stockQty)
    this.taxPerc = taxPerc.toString()
    console.log(this.expProfit, this.stockQty, this.taxPerc)

  }

  stringtoNumber(value: string){
    return Number.parseFloat(value.replace(',',''))
  }

  getAllIndices(){
    this.stockService.getAllIndices().subscribe(data => {
      this.indices = data['indices']
      console.log(this.indices)
    })
  }

  getAllStocks(){
    this.stockService.getAllStocksDetails().subscribe(data => {
      this.allStocks = data['stocks']
      // console.log(this.indices)
    })
  }

  getStockDetails(stockId: number){
    return this.allStocks.filter(e => e.stock_id == stockId)[0]
  }

  addStockAlert(stockId, percent=5){
    let stock = this.stockDetails[stockId]
    this.changeNewAlert(stock)
    this.newAlert.alert_stock_id = stockId
    let value = (this.stockDetails[stockId].stock_live_price - this.stockDetails[stockId].stock_live_price*percent/100).toString()
    this.newAlert.alert_value = parseFloat(value).toFixed(2)
    value = (this.stockDetails[stockId].stock_live_price + this.stockDetails[stockId].stock_live_price*percent/100).toString()
    if(confirm(`Alert for ${stock.stock_name} - ${this.newAlert.alert_value} : ${parseFloat(value).toFixed(2)}`)){
      this.addNewAlert()
      this.newAlert.alert_type = 'PRICE_GE'
      this.newAlert.alert_value = parseFloat(value).toFixed(2)
      this.addNewAlert()
    }
  }

  changeNewAlert(stock){
    console.log(stock)
    this.newAlert.alert_stock_id = stock.stock_id
    this.newAlert.alert_current_value = stock.stock_current_price
    this.newAlert.alert_type = 'PRICE_LE'
    this.newAlert.alert_portfolio_id = this.activePortfolio
    console.log(this.newAlert)
  }

  changeNewTodo(stock){
    console.log(stock)
    this.newTodo.stockId = stock.stock_id
    this.newTodo.startPrice = stock.stock_current_price
    this.newTodo.action = 'BUY'
    this.newTodo.portfolioId = this.activePortfolio
    console.log(this.newTodo)
  }

  removeAlert(alertId){
    this.stockService.removeAlertById(alertId).subscribe(data => {
      this.getAlertData()
    })
  }

  removeTodo(todoId){
    this.stockService.removeTodoById(todoId).subscribe(data => {
      this.getTodoData()
    })
  }

  getAlertData(){
    this.alertData = []
    this.stockService.getAlertForPorfolio(this.activePortfolio).subscribe(data => {
      this.alertData = data['alerts']
    })
  }
  splitText(text: string, sep: string){
    return text.split(sep, 10)
  }

  getTodoData(){
    this.todoData = []
    this.stockService.getTodoForPorfolio(this.activePortfolio).subscribe(data => {
      this.todoData = data['todos']
      this.todoData.forEach(x => {
        x.stock_name = this.getStockDetails(x.stock_id).stock_name
      });
      this.todoData.sort((a, b)=>{
        let d1 = Date.parse(a['add_date'])
        let d2 = Date.parse(b['add_date'])
        if(d1 < d2)
          return 1
        else if(d1 > d2)
          return -1
        return  0
      })
      // console.table(this.todoData)
    })
  }

  getTODOAccuracy() {
    // console.table(this.todoData)
    let success = 0;
    for(let i=0;i<this.todoData.length;i++) {
      let item: any = this.todoData[i]
      let stock: any = this.getStockDetails(item.stock_id)
      // console.log(item)
      if (item.action.toLowerCase() == 'sell') {
        if (item.stock_start_price >= stock.stock_current_price) {
          success += 1
        }
      }
      else if (item.action.toLowerCase() == 'buy') {
        if (item.stock_start_price <= stock.stock_current_price) {
          success += 1
        }
      }

    }
    // console.log(success)
    // console.log(failure)
    return (success)*100/this.todoData.length

  }

  filteredTodo(){
    if(this.todoStockFilter.length >= 2)
      return this.todoData.filter(x => x.stock_name.toLowerCase().includes(this.todoStockFilter.toLowerCase())).sort((a, b)=>{
        let d1 = Date.parse(a['add_date'])
        let d2 = Date.parse(b['add_date'])
        if(d1 < d2)
          return 1
        else if(d1 > d2)
          return -1
        return  0
      })
    return this.todoData
  }

  addNewAlert(){
    this.stockService.addNewAlert(this.activePortfolio, this.newAlert).subscribe(data => {
      this.getAlertData()
    })
  }

  updateTodo(todoId: number, status: string, reason: string){
    this.stockService.updateTodo(todoId, status, reason).subscribe(data => {
      this.getTodoData()
    })
  }

  addNewTodo(){
    this.stockService.addNewTodo(this.activePortfolio, this.newTodo).subscribe(data => {
      console.log(data)
      this.getTodoData()
    })
  }

  dtimeToDate(datetime){
    let date = new Date(Date.parse(datetime))
    return date.toLocaleDateString().slice(0, 10)
  }

  filterDataWithPipe(array, keyword, id_){
    if(keyword.length == 0)
      return array
    return this.filterPipe.transform(array, keyword, this.stockDetails, id_)
  }

  onChangePage(event, array, key_='brDetails'){
    // console.log(event)
    // if (array.length <= event.pageSize){
    //   this.pagedFiltered[key_] = array
    //   return
    // }
    this.pagedFiltered[key_] = array.slice(
      event.pageIndex*event.pageSize,
      Math.min(array.length, (event.pageIndex + 1)*event.pageSize)
    )
  }

  onFileSelect(event){
    this.fileToUpload = event.target.files[0]
    console.log(this.fileToUpload)
  }

  uploadTrans(){
    
    if(this.newInvestment.inv_stock_id != null){
      console.log("Uploading")
      this.portfolioService.uploadTransFiles(
        this.activePortfolio,
        this.newInvestment.inv_stock_id,
        this.fileToUpload
      ).subscribe(data => {
        console.log(data)
        this.changePortfolio(this.activePortfolio)
      })
    }
  }

  changeNewInvestment(stock){
    console.log(stock)
    this.newInvestment.inv_stock_name = stock.stock_name
    this.newInvestment.inv_stock_id = stock.stock_id
    this.newInvestment.inv_stock_cost_price_per_share=stock.stock_current_price
    
  }

  updatePagedFiltered(){
    let dummyEvent = {
      'pageSize': 30,
      'pageIndex': 0
    }

    // this.onChangePage(event, this.brDetails, 'brDetails')
    this.onChangePage(
      dummyEvent, 
      this.filterDataWithPipe(this.dealDetails, this.eventKW, 'deal_stock_id'),
      'dealDetails'
    )
    this.onChangePage(
      dummyEvent, 
      this.filterDataWithPipe(this.insDetails, this.eventKW, 'ins_stock_id'),
      'insDetails'
    )
    this.onChangePage(
      dummyEvent, 
      this.filterDataWithPipe(this.brDetails, this.eventKW, 'brokres_stock_id'),
      'brDetails'
    )
    this.onChangePage(
      dummyEvent, 
      this.filterDataWithPipe(this.divDetails, this.eventKW, 'div_stock_id'),
      'divDetails'
    )

    this.onChangePage(
      dummyEvent, 
      this.filterDataWithPipe(this.newsDetails, this.eventKW, 'news_stock_id'),
      'newsDetails'
    )

    this.onChangePage(
      dummyEvent, 
      this.filterDataWithPipe(this.bmDetails, this.eventKW, 'bm_stock_id'),
      'bmDetails'
    )

    this.onChangePage(
      dummyEvent, 
      this.filterDataWithPipe(this.agmDetails, this.eventKW, 'agm_stock_id'),
      'agmDetails'
    )
    // console.table(this.pagedFiltered['dealDetails'])
    // this.onChangePage(event, this.brDetails, 'brDetails')
    // this.onChangePage(event, this.brDetails, 'brDetails')
    // this.onChangePage(event, this.brDetails, 'brDetails')
    // this.onChangePage(event, this.brDetails, 'brDetails')
  }


  getLatestCount(dataArray: Array<any>, key_: string){
    let latestValue = null
    let newCount = 0
    // console.table(dataArray.slice(0,10))
    // console.log(`Key : ${key_}`)
    dataArray.forEach(item => {
      if(latestValue == null || latestValue < item[key_])
        latestValue = item[key_]
    })

    // console.log(`Latest value : ${latestValue}`)
    dataArray.forEach(item => {
      if(latestValue == item[key_])
        newCount += 1
    })
    return {
      'newCount': newCount,
      'lValue': latestValue
    }
  }

  numberToString(value: Number){
    return value.toString()
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
      let stk_obj = this.stockDetails[inv.inv_stock_id]
      if(inv.inv_stock_cost_price < stk_obj.stock_latest_price){
        total += (stk_obj.stock_latest_price - inv.inv_stock_cost_price) * inv.inv_stock_qty
      }
    }
    return Number(total.toFixed(2))
  }

  getUniqueStocks(){
    let unique_stocks = []
    for(let inv of this.investmentDetails){
      if(unique_stocks.indexOf(inv.inv_stock_id) == -1){
        unique_stocks.push(inv.inv_stock_id)
      }
    }
    return unique_stocks

  }

  getInvestmentForStock(stockId: number){
    let result = []
    this.portfolioInvestments.forEach(item => {
      if(item.inv_stock_id == stockId)
        result.push(item)
    });
    return result
  }

  getBrokerRatings(skipCache=0){
    // this.brokerRatings = []
    this.stockService.getBrokerRatings(skipCache).subscribe(data => {
      this.brokerRatings = data['brokerrating'][0]
      
      let brokers = Object.keys(this.brokerRatings)
      for(let i=0; i<brokers.length;i++){
        let br = brokers[i]
        this.brokerRatings[br]['min_date_diffs'] = Math.min(...this.brokerRatings[br]['date_diffs'])
        this.brokerRatings[br]['max_date_diffs'] = Math.max(...this.brokerRatings[br]['date_diffs'])
        this.brokerRatings[br]['mean_date_diffs'] = this.getAvg(this.brokerRatings[br]['date_diffs'])

      }
      console.log(this.brokerRatings)
      this.getBrokRes()
    })
  }

  getAvg(nums: []){
    const total = nums.reduce((acc, c) => acc + c, 0)
    return Math.round(total/nums.length)
  }



  changePortfolio(portfolioId) {
    if (!isNaN(portfolioId)) {
      
      // this.liveTrack = false;
      this.activePortfolio = parseInt(portfolioId);
     
      console.log(`Portfolio changed to ${this.activePortfolio}`);

      this.portfolioService.getPortfolioById(this.activePortfolio).subscribe(data => {
        // console.log(data)
        this.portfolioDetails = data['portfolio']
        this.stockDetails = data['stocks']
        // console.table(this.stockDetails)
        this.portfolioStats = data['stats']
        console.log(this.stockDetails)

        let stockIds = Object.keys(this.stockDetails)
        for(let i=0;i<stockIds.length;i++){
          let sid = stockIds[i]
          this.stockDetails[sid]['stock_live_price'] = this.stockDetails[sid]['stock_latest_price']
          this.stockDetails[sid]['stock_live_updatetime'] = this.stockDetails[sid]['stock_price_update_datetime']
        }

        this.portfolioInvestments = data['investments']
        this.investmentDetails = this.aggInvestment(data['investments'], false);
        this.sellDetails = this.aggInvestment(data['investments'], true);

        this.investmentDetails.forEach(item => {
          // item['stock_live_price'] = this.stockDetails[item.inv_stock_id]['stock_live_price']
          item['price_diff'] = (this.stockDetails[item.inv_stock_id]['stock_latest_price'] - item.inv_stock_cost_price)*item.inv_stock_qty
        })

        this.sellDetails.forEach(item => {
          // item['stock_live_price'] = this.stockDetails[item.inv_stock_id]['stock_live_price']
          item['price_diff'] = (this.stockDetails[item.inv_stock_id]['stock_latest_price'] - item.inv_stock_cost_price)*item.inv_stock_qty
        })

        this.investmentDetails = this.sortDataArray(this.investmentDetails, this.stockDetails)
        this.sellDetails = this.sortDataArray(this.sellDetails, this.stockDetails)
        
       
        // console.table(this.portfolioInvestments)
        // console.table(this.investmentDetails)
        // console.table(this.sellDetails)
        
        this.getDeals();
        this.getDividends();
        this.getAGM();
        this.getBM();
        this.getInsider();
        this.getBrokerRatings();
        this.getNews();
        this.getAlertData();
        this.getTodoData();
        
        this.getPriceHistoryForPortfolio(this.activePortfolio, this.historyLB);
        this.drawPL()


        setTimeout( () => {
          this.changePortfolioTab(0)
          this.hTable.renderRows()
          this.shTable.renderRows()
          // this.getInvTrend()
        }, 1000)
        // console.log(this.topLeftChart)
        if(this.liveTrack == true){
          this.getLivePriceHistoryForPortfolio(this.priceType)
        }
        
        
      })
    }
  }


  changePortfolioTab(tab){

    if(tab == 1){
      this.getInvTrend()
    }
    else if(tab == 0){
      this.getSectorWiseAllocation(this.investmentDetails, this.portfolioDetails['value_invested'])
    }
    else if(tab == 2){
      this.getDivHistory()
    }
    else{
      this.drawPL()
    }
  }

  getDivHistory(){
    let stockIds = []

    Object.keys(this.stockDetails).forEach((stockId:any) => {
      stockIds.push(stockId)
    })

  
    let divData = {}
    Object.keys(this.stockDetails).forEach(stockId => {
      divData[this.stockDetails[stockId]['stock_name']] = []
    })
    
    let extract_rs = (remark: string) => {
      // console.log(remark)
      const match = remark.match(/Rs\.(.*) per/)
      if(match)
        return match[1]
      console.log(remark)
      return "0"
    }

    let getQuarter = (month: number) => {
      if((month >= 9) && (month <= 11)){
        return 11
      }
      if(month >= 0 && month <= 2)
        return 2
      if(month >= 3 && month <= 5)
        return 5
      if(month >= 6 && month <= 8)
        return 8
    }

    let getTotalQty = (stockId) => {
      let totQty = 0
      for(let i=0;i<this.investmentDetails.length;i++){
        let inv = this.investmentDetails[i]
        if(inv.inv_stock_id === stockId){

          totQty += inv.inv_stock_qty
        }
      }
      return totQty
    } 


    this.stockService.getDividendForStocks(stockIds, 365*2).subscribe(data => {
      let divs = data['dividends']
      let stock_prevs = {}
      divs.forEach(div => {
        let stock = this.stockDetails[div['div_stock_id']]
        let rs = extract_rs(div['div_remarks'])
        if(rs != "0"){
          let d = new Date(div['div_eff_date'])
          d.setDate(1)
          let newMonth = getQuarter(d.getMonth())
          // if(newMonth > d.getMonth())
          //   d.setFullYear(d.getFullYear() - 1)
          d.setMonth(newMonth)
          console.log(d)
          console.log(stock.stock_name, d.toUTCString(), div['div_remarks'], rs)
          if(Object.keys(stock_prevs).indexOf(stock.stock_name) != -1){  
            if(stock_prevs[stock.stock_name].indexOf(d.toUTCString()) == -1){
              divData[stock.stock_name].push([
                Date.parse(d.toUTCString()),
                Number.parseFloat(rs) * getTotalQty(div['div_stock_id'])
              ])
              stock_prevs[stock.stock_name] = d.toUTCString()
            }
            else{
              let tot_val = divData[stock.stock_name][divData[stock.stock_name].length - 1][1]
              tot_val += Number.parseFloat(rs) * getTotalQty(div['div_stock_id'])
              divData[stock.stock_name][divData[stock.stock_name].length - 1][1] = tot_val
            }
          }
          else{
            stock_prevs[stock.stock_name] = d.toUTCString()
            divData[stock.stock_name].push([
              Date.parse(d.toUTCString()),
              Number.parseFloat(rs) * getTotalQty(div['div_stock_id'])
            ])
          }
        }
      })

      
      let graphData = []
      Object.keys(divData).forEach(stockName => {
        if(divData[stockName].length > 0)
          graphData.push({
            'name': stockName,
            'data': divData[stockName]
          })
      })
      console.log(graphData)
      let plotOptions = {
        'column': {
          'stacking': 'stream',
          'pointWidth': 25
        },

      }
      this.drawInvTrend(graphData, 'column', 'Dividends', 'div-trend', plotOptions)
    })
  }

  getCagr(stockId){
    let invs: any[] = this.getInvestmentForStock(stockId)
    let totValInitial: number = 0
    let totValFinal: number = 0
    let dates = new Array<string>();
    for(let i=0; i<invs.length;i++){
      let inv = invs[i]
      totValInitial = totValInitial + inv.inv_stock_cost_price * inv.inv_stock_qty
      totValFinal = totValFinal + this.stockDetails[stockId].stock_latest_price * inv.inv_stock_qty
      dates.push(inv.inv_datetime)
      // console.log(inv.inv_datetime)
    }

    let minYear = new Date(Date.parse(dates.sort()[0] as string)).getFullYear()
    let curYear = new Date().getFullYear();
    return this.roundFloat((Math.pow(totValFinal/totValInitial, 1/Math.max(1, curYear - minYear + 1)) - 1)*100)
  }

  getInvTrend(){
    this.portfolioService.getPortfolioTrendById(this.activePortfolio).subscribe(resp => {
      console.log(resp)
      let data = {
        'Purchases': [],
        'Sells': []
      }
      
      resp['data'].forEach(item => {
        if(item['amount'] > 0)
          data['Purchases'].push(
            [
              Date.parse(item['date']),
              item['amount']
            ]
          )
        else{
          console.log("Sells :")
          console.log(item)
          data['Sells'].push(
            [
              Date.parse(item['date']),
              item['amount']
            ]
          )
        }
            
      });

      let trend = [{
        'name': 'Purchases',
        'data': data['Purchases']
      },
      {
        'name': 'Sells',
        'data': data['Sells']
      }]
      

      this.drawInvTrend(trend, 'column', 'Investment Trend', 'inv-trend', {})

    });
  }

  getQuarter(month: number){
    if((month >= 9) && (month <= 11)){
      return 11
    }
    if(month >= 0 && month <= 2)
      return 2
    if(month >= 3 && month <= 5)
      return 5
    if(month >= 6 && month <= 8)
      return 8
  }


  convertDateToQtr(dat:string){
    // split and get just date part to avoid any timezone string
    let d = new Date(dat.split(' ')[0])
    d.setDate(1)
    console.log(d)
    console.log(d.getMonth())
    let newMonth = this.getQuarter(d.getMonth())
    // if(newMonth > d.getMonth())
    //   d.setFullYear(d.getFullYear() - 1)
    d.setMonth(newMonth)
    console.log(d)
    return d
  } 

  drawPL(){
    let stockData = {}

    for(let i=0;i<this.sellDetails.length;i++){
      let item = this.sellDetails[i]
      let stock = this.getStockFromId(item.inv_stock_id)
      let value = (item.inv_stock_cost_price - item.inv_stock_sell_price) * item.inv_stock_qty * -1
      // todo fix the var names
      if(Object.keys(stockData).indexOf(stock.stock_name) == -1)
        stockData[stock.stock_name] = []
      stockData[stock.stock_name].push([
        Date.parse(this.convertDateToQtr(item.inv_datetime).toUTCString()),
        value
      ])
    }

    let trend = []
    Object.keys(stockData).forEach(x => {
      trend.push({
        'name': x,
        'data': stockData[x]
      })
    })

    let plotOptions = {
      'column': {
        'stacking': 'stream',
        'pointWidth': 25
      },

    }

    this.drawInvTrend(trend, 'column', 'PL Trend', 'pl-trend', plotOptions)

  }

  getSectorWiseAllocation(investmentDetails, totalValue){
    let sectorData = []
    let sectors = {}
    
    investmentDetails.forEach(each => {
      // console.log(each)
      let sector = this.stockDetails[each.inv_stock_id].stock_category
      // console.log(this.stockDetails[each.inv_stock_id])
      if(Object.keys(sectors).indexOf(sector) == -1)
        sectors[sector] = 0
      sectors[sector] += Number((each.inv_stock_cost_price * each.inv_stock_qty).toFixed(2))
    });

    Object.keys(sectors).forEach(sector => {
      sectorData.push({
        name: sector, 
        y: sectors[sector]/totalValue
      })
    })
    
    this.drawPortfolioAllocation(sectorData)
  }

  getMaxTargetFromBR(stock_id){
    // console.log(this.brDetails)
    let maxTarget = -1;
    this.brDetails.forEach(item => {
      if(item.brokres_stock_id == stock_id){
        maxTarget = Math.max(Number.parseFloat(item.brokres_target), maxTarget)
      }
    })
    return maxTarget
  }


  removeAPF() {
    this.portfolioService.removePortfolioById(this.activePortfolio).subscribe(data => {
      // console.log("Delete Successful!")
      this.getLatestPFs()
      this.portfolioDetails = null;
    })
  }

  getHeader(jsonArray: Array<any>) {
    if (jsonArray.length > 0) {
      let headers = Object.keys(jsonArray[0])
      // console.log(headers)
      let cleanHeader = []
      headers.forEach(element => {
        if (element[0] != '_') {

          let cheader = element.replace('_', ' ')
          cleanHeader.push(cheader)
        }
      });
      // console.log(cleanHeader)
      return cleanHeader
    }
  }

  roundFloat(floatValue: Number) {
    if(floatValue == undefined || floatValue == NaN)
      return "0"
    return Number(floatValue.toFixed(2)).toLocaleString();
  }

  getStockList(event) {
    let stockName = event.target.value
    if (this.stockAutoCompleteTO != null) {
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

  setInvestmentDate(event){
    let setDate: Date = event.value
    this.newInvestment.inv_date = (setDate.getMonth()+1)+'/'+setDate.getDate()+'/'+setDate.getFullYear();
  }
  addInvestment() {
    console.log(this.newInvestment)
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

  toggleLiveTracking(event){

    if(event.checked == true){
      if(this.liveTrackInterval != null)
        clearInterval(this.liveTrackInterval)
      
      let date = new Date()
      if(date.getDay() == 0 || date.getDay() == 6){
        alert("Market Holiday!")
        this.liveTrack = false
        event.source.checked = false
      }
      else if(date.getHours() >= 16 || date.getHours() < 9){
        this.liveTrack = event.checked
        this.getLivePriceHistoryForPortfolio(this.priceType)
        // alert("Off Market Hrs")
      }
      else{
        this.liveTrack = event.checked
        this.getLivePriceHistoryForPortfolio(this.priceType)
        this.liveTrackInterval = setInterval(() => {
          this.getLivePriceHistoryForPortfolio(this.priceType)
        }, 60*1000)
      }
        
    }
    else{
      this.liveTrack = event.checked
      if(this.liveTrackInterval != null)
        clearInterval(this.liveTrackInterval)
      
    }
    console.log(event)
    console.log(`Track : ${this.liveTrack}`)
  }

  addPad(width, string, padding) { 
    return (width <= string.length) ? string : this.addPad(width, padding + string, padding)
  }

  getDateDiff(startDate: string, endDate: string){
    const a = new Date(startDate);
    const b = new Date(endDate);
    // console.log(startDate, endDate)
    // console.log(a, b)
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
  }


  formatDays(days: number){
    if(days >= 365)
      return `${this.roundFloat(days/365)} years`
    return `${days} days`
  }
  aggInvestment(investmentDetails, sellFlag=false){
    let investments = [];
    var indexLookup = {};
    var currentDate = new Date()
    var day = this.addPad(2, currentDate.getDate().toString(), '0')
    var month = this.addPad(2, currentDate.getMonth() + 1, '0')
    var year = currentDate.getFullYear()
    var dateStr = `${year}-${month}-${day} 00:00:00`

    let updateInvestment = (list, inv, sellFlag) => {
      // console.log(indexLookup)
      // console.log(inv.inv_stock_id)
      // console.log(Object.keys(indexLookup).indexOf(String(inv.inv_stock_id)))
      if(Object.keys(indexLookup).indexOf(String(inv.inv_stock_id)) == -1){
        indexLookup[String(inv.inv_stock_id)] = list.length
        
        list.push(inv)
        list[list.length-1].last_inv_days = this.getDateDiff(inv.inv_datetime, dateStr)
        return list
      }
      else{
        let i = indexLookup[String(inv.inv_stock_id)]
        
        list[i].inv_id = inv.inv_id;
        if(!sellFlag){
          if((list[i].inv_stock_qty + inv.inv_stock_qty) > 0)
            list[i].inv_stock_cost_price = (inv.inv_stock_cost_price*inv.inv_stock_qty + list[i].inv_stock_cost_price*list[i].inv_stock_qty)/(list[i].inv_stock_qty + inv.inv_stock_qty);
          list[i].inv_stock_qty = list[i].inv_stock_qty + inv.inv_stock_qty;
        }
        else{
          list[i].inv_stock_cost_price = (inv.inv_stock_cost_price*inv.inv_stock_qty + list[i].inv_stock_cost_price*list[i].inv_stock_qty)/(list[i].inv_stock_qty + inv.inv_stock_qty);
          list[i].inv_stock_qty = list[i].inv_stock_qty + inv.inv_stock_qty;
          list[i].inv_stock_sell_price = inv.inv_stock_sell_price
          list[i].inv_datetime = inv.inv_datetime
        }
        // if(list[i].inv_stock_qty <= 0)
        //   list[i].inv_stock_cost_price
        list[i].inv_remarks = inv.inv_remarks
        list[i].last_inv_days = Math.min(list[i].last_inv_days, this.getDateDiff(inv.inv_datetime, dateStr))
        return list
        
      }
      
    }
    let invDCopy = JSON.parse(JSON.stringify(investmentDetails))
    invDCopy.sort((a, b) => a.inv_datetime < b.inv_datetime? -1:a.inv_datetime === b.inv_datetime?0:1)
    // console.table(invDCopy)
    for(let i=0; i<invDCopy.length; i++){
      let inv = JSON.parse(JSON.stringify(invDCopy[i]))
      if(!sellFlag)
        investments = updateInvestment(investments, inv, sellFlag)
      else{
        if(inv.inv_stock_qty < 0)
          investments = updateInvestment(investments, inv, sellFlag)
      }
    }
    // remove 0 qty investments
    // console.table(investments)
    let i = 0;
    let maxLen = investments.length;
    while(i < maxLen){
      let inv = investments[i]
      // console.log(this.getStockDetails(inv.inv_stock_id))s
      if( inv.inv_stock_qty == 0){
        // console.log("Removing 0 QTY")
        // console.log(this.getStockDetails(inv.inv_stock_id))
        investments.splice(i, 1);
        maxLen -= 1;
        continue
      }
      i++;
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
    
  async updateStockDetails(){
    this.refreshInProgress = true;
    let chunksize = 2
    let items = []
    let stockIds = Object.keys(this.stockDetails)

    for(let i=0; i<stockIds.length;i++){
      // if(marked.indexOf(this.stockDetails[i].stock_id) != -1)
      //   continue

      // marked.push(this.stockDetails[i].stock_id)
      items.push(stockIds[i])
      if(items.length >= chunksize)
      {
        try{
          await this.stockService.updateStockDetails(items, []).toPromise()
        }
        catch(error){
          console.log(error)
        }
        finally{
          this.currentProgress = (i+1)*100/stockIds.length
        }
        items = []
      }
      
    }

    if(items.length > 0){
      try{
        await this.stockService.updateStockDetails(items, []).toPromise()
      }
      catch(error){
        console.log(error)
      }
      finally{
        this.currentProgress = 100
      }
    }


    this.refreshInProgress = false
    this.currentProgress = 0
    this.getBrokerRatings(1)
    this.changePortfolio(this.activePortfolio)

  }

  getFloatFromLocale(numStr){
    return parseFloat(numStr.replace(',', ''))
  }


  getStockFromId(stockId){

    if(this.stockDetails[stockId] != undefined)
      return this.stockDetails[stockId]

    return {
      'stock_name': "unknown",
      'stock_live_price': null,
      'stock_latest_price': null,
      'stock_live_updatetime': null
    }
   
    

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
    let stockIds = Object.keys(this.stockDetails)
    if(stockIds.length > 0)
      this.stockService.getBrokResforStocks(stockIds).subscribe(data => {
        // console.table(data['deals'])
        this.brDetails = data['broker-research']
        this.pagedFiltered['brDetails'] = this.brDetails.slice(0, 30)
      })
  }

  getAGM(){
    this.agmDetails = []
    let stockIds = Object.keys(this.stockDetails)
    if(stockIds.length > 0)
      this.stockService.getAGMforStocks(stockIds).subscribe(data => {
        // console.table(data['deals'])
        this.agmDetails = data['agm']
        this.pagedFiltered['agmDetails'] = this.agmDetails.slice(0, 30)
      })
  }

  getNews(){
    this.newsDetails = []
    let stockIds = Object.keys(this.stockDetails)
    if(stockIds.length > 0)
      this.stockService.getNewsforStocks(stockIds).subscribe(data => {
        // console.table(data['deals'])
        this.newsDetails = data['news']
        this.pagedFiltered['newsDetails'] = this.newsDetails.slice(0, 30)
        // console.table(this.newsDetails)
      })
  }

  getDeals(){
    this.dealDetails = []
    this.pagedFiltered['dealDetails'] = []
    let stockIds = Object.keys(this.stockDetails)
    if(stockIds.length > 0)
      this.stockService.getDealsforStocks(stockIds).subscribe(data => {
        // console.table(data['deals'])
        this.dealDetails = data['deals']
        this.pagedFiltered['dealDetails'] = this.dealDetails.slice(0, 30)

      })
  }

  getInsider(){
    this.insDetails = []
    let stockIds = Object.keys(this.stockDetails)
    if(stockIds.length > 0)
      this.stockService.getInsforStocks(stockIds).subscribe(data => {
        // console.table(data['deals'])
        this.insDetails = data['insider']
        this.pagedFiltered['insDetails'] = this.insDetails.slice(0, 30)
      })
  }

  getBM(){
    this.bmDetails = []
    let stockIds = Object.keys(this.stockDetails)
    if(stockIds.length > 0)
      this.stockService.getBMforStocks(stockIds).subscribe(data => {
        // console.table(data['deals'])
        this.bmDetails = data['bm']
        this.pagedFiltered['bmDetails'] = this.bmDetails.slice(0, 30)
      })
  }

  getDividends(){
    this.divDetails = []
    let stockIds = Object.keys(this.stockDetails)
    if(stockIds.length > 0)
      this.stockService.getDividendForStocks(stockIds).subscribe(data => {
        // console.table(data['dividends'])
        this.divDetails = data['dividends']
        this.pagedFiltered['divDetails'] = this.divDetails.slice(0, 30)
      })
  }

  changePriceHistory(lookBack){
    this.historyLB = lookBack;
    this.getPriceHistoryForPortfolio(this.activePortfolio, lookBack);
    
  }

  changePriceType(newType){
    this.priceType = newType
    this.getPriceHistoryForPortfolio(this.activePortfolio, this.historyLB, this.priceType)
    if(this.liveTrack == true){
      this.getLivePriceHistoryForPortfolio(this.priceType)
    }
  }

  sortDataArray(data: Array<any>, refData){
    let sortFunc = (a,b) => {
      let x = a.price_diff
      let y = b.price_diff
      // console.log(refData[a.inv_stock_id].stock_name, x, y, refData[b.inv_stock_id].stock_name, x>y)
      return x-y
    }
    // console.table(data)
    data.sort(sortFunc)
    // console.table(data)

    return data
  }

  async getLivePriceHistoryForPortfolio(priceType="stock_price_close"){
    let liveStockPH = {}
    let currentLivePFStockValue = []
    let max_len = -1
  
    let stockIds = Object.keys(this.stockDetails)
    // console.table(this.stockDetails)
    
    let stockData = await this.stockService.getPriceHistory(stockIds, 1).toPromise()
      
    for(let i=0; i<stockIds.length;i++){
      let sid = stockIds[i]
      console.log(sid, this.getStockFromId(sid).stock_name)
      this.stockDetails[sid]['stock_live_updatetime'] = null
      let data = stockData[sid]
      // console.table(data['price_history'])
    
      liveStockPH[sid] = data['price_history']
      try {  
        this.stockDetails[sid]['stock_live_price'] = data['price_history'][data['price_history'].length-1]['stock_price_close']
        this.stockDetails[sid]['stock_live_updatetime'] = new Date().toLocaleTimeString()

        console.log([sid, data['price_history'].length])
        if(max_len == -1){
          max_len = data['price_history'].length
        }

        if(data['price_history'].length > max_len)
          max_len = data['price_history'].length
      } catch (error) {
        console.error(error)
      }
      

    }

    this.investmentDetails.forEach(item => {
      // item['stock_live_price'] = this.stockDetails[item.inv_stock_id]['stock_live_price']
      item['price_diff'] = this.stockDetails[item.inv_stock_id]['stock_live_price'] - this.stockDetails[item.inv_stock_id]['stock_latest_price']
    })


    this.investmentDetails = this.sortDataArray(this.investmentDetails, this.stockDetails)
    this.hTable.renderRows()
    this.shTable.renderRows()
 
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
    let date = new Date()
    // let currentDate = `${date.}`
    let timedelta = Date.parse(date.toDateString()) + (5.75+9)*60*60*1000
    console.log(timedelta)

    this.investmentDetails.forEach((investment, index) => {
      let dataLive = []
      liveStockPH[investment.inv_stock_id].forEach((ph, index) => {
        // if(index >= max_len)
        //   return

        let t = index*60*1000 + timedelta
        
        dataLive.push(
          [
            t,
            investment.inv_stock_qty * ph[priceType],
            // investment.inv_stock_qty * investment.inv_stock_cost_per_share
          ]
        )

        totalLive = updateTotal(
          totalLive, t,
          investment.inv_stock_qty * ph[priceType]
        )

      });

      while(true){
        index = dataLive.length
        if(index >= max_len)
          break
        //append last values until maxLen
        let t = index*60*1000 + timedelta
        dataLive.push(
          dataLive[index-1]
        )

        totalLive = updateTotal(
          totalLive, t,
          dataLive[index-1][1]
        )

      }

      let color = this.getRandomColors(inColors)
      inColors.push(color)
      currentLivePFStockValue.push({
        'name': this.getStockFromId(investment.inv_stock_id).stock_name,
        'data': dataLive,
        'color': color,
        // 'visible': firstSelected?true:false
        'visible': false
      })
      console.log(this.getStockFromId(investment.inv_stock_id).stock_name)
      console.log(dataLive.length)
    

    });

    // console.table(currentLivePFStockValue[currentLivePFStockValue.length-1]['data'])

    let color = this.getRandomColors(inColors)
    inColors.push(color)
    currentLivePFStockValue.push({
      'name': 'Total',
      'data': totalLive,
      'color': color,
    })


      
    

    this.drawPortfolioTrend(currentLivePFStockValue, 'Portfolio Trend - LIVE', 'portfolio-trend-live')
    this.ref.detectChanges()
  }

  getPriceHistoryForPortfolio(portfolioId, lookBack=30, priceType="stock_price_close") {
    this.stockPriceHistory = {}
    this.topGainers = []
    this.topLosers = []

    this.portfolioService.getPriceHistoryForPortfolio(portfolioId, lookBack).subscribe(data => {
      
      let priceHistory: any = data['price_history'];
      // console.log(priceHistory)
      let stockIds = Object.keys(priceHistory)
      console.log(stockIds)
      for(let i=0;i<stockIds.length;i++){
        let stockId = stockIds[i]
        this.stockPriceHistory[stockId] = priceHistory[stockId]
      }

      this.changeStock(stockIds[0])
      this.getGainersLosers()
      
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
              investment.inv_stock_qty * ph[priceType],
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
            investment.inv_stock_qty * ph[priceType]
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
      inColors.push(color)

      totalLive.sort((a, b) => {
        if (a[0] == b[0])
          return 0
        else if (a[0] < b[0])
          return -1
        return 1
      })

      totalFixed.sort((a, b) => {
        if (a[0] == b[0])
          return 0
        else if (a[0] < b[0])
          return -1
        return 1
      })

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

      // console.table(totalLive)

      let populateIndices = async (lookBack, priceType, inColors)  => {
        console.log("populating indices....")
        for(let i=0; i<this.indices.length;i++) {
          let ind = this.indices[i]
          let data = await this.stockService.getIndexPriceHistory(ind, lookBack).toPromise()
          let pth = data['point_history']
          // console.table(pth)
          let dataPoint = []
          pth.forEach(pt => {
            dataPoint.push(
              [
                Date.parse(pt.ind_point_date),
                pt[priceType],
                // investment.inv_stock_qty * investment.inv_stock_cost_per_share
              ]
            )
          });

    
          let color = this.getRandomColors(inColors)
          inColors.push(color)
          this.currentPFStockValue.push({
            'name': ind.ind_name,
            'data': dataPoint,
            'color': color,
            'yAxis': 1,
            'visible': false

          })

          // console.table(pth)
        }
        this.drawPortfolioTrend(this.currentPFStockValue)
      }

      let indPriceType = priceType.indexOf('low') == -1? 'ind_point_low': priceType.indexOf('high')? 'ind_point_high': priceType.indexOf('open')? 'ind_point_open': 'ind_point_close'
      populateIndices(lookBack, indPriceType, inColors)

      
    });
  }

  


  changeStock(stockId: string){
    // if(this.currentStockId == stockId)
    //   return
    this.currentStockId = stockId
    let stock = this.getStockFromId(stockId)
    if(this.currentStockValue.length > 0){
      if(this.currentStockValue[this.currentStockValue.length - 1].name == stock.stock_name)
        return
    }
    this.currentStockValue = []
    let dataLive = []
    let volumes = []
    let mov_avg = []
    let bh = []
    let bl = []
    
    let max_volume = 0
    let stockName = stock.stock_name
    this.stockPriceHistory[stockId].forEach(item => {
      dataLive.push([
        Date.parse(item.stock_price_date),
        item[this.priceType]
      ])
      volumes.push([
        Date.parse(item.stock_price_date),
        item.stock_price_volume
      ])
      mov_avg.push([
          Date.parse(item.stock_price_date),
          item.MA
      ])

      bh.push([
          Date.parse(item.stock_price_date),
          item.BH
      ])

      bl.push([
          Date.parse(item.stock_price_date),
          item.BL
      ])

      max_volume = max_volume < item.stock_price_volume? item.stock_price_volume: max_volume
    });

    this.currentStockValue = [{
        'name': stockName,
        'data': dataLive,
        'visible': true
      },
      {
        'name': 'MA',
        'data': mov_avg,
        'visible': true
        
      },
      {
        'name': 'BH',
        'data': bh,
        'visible': true
        
      },
      {
        'name': 'BL',
        'data': bl,
        'visible': true
      },
      {

      'name': 'Volume',
      'data': volumes,
      'type': 'area',
      'yAxis': 1,
      // 'pointWidth': Math.max(1, 240.0/volumes.length)
      }
    ]
    this.drawPriceHistory(this.currentStockValue, max_volume, stockName, 'stock-trend')
  
    // this.drawStockTrend()
    this.updateExpProfit(this.expProfit, this.taxPerc, this.stockQty="-1")
  }

  getGainersLosers(){
    this.topGainers = []
    this.topLosers = []
    
    let stockIds = Object.keys(this.stockPriceHistory)
    stockIds.forEach(sid => {

      try {
        // console.log(this.stockPriceHistory[sid])
        let l = this.stockPriceHistory[sid].length
        let s = this.stockPriceHistory[sid][0][this.priceType]
        let e = this.stockPriceHistory[sid][l-1][this.priceType]

        let d = e - s
        if(d > 0){
          this.topGainers.push({
            'stockId': sid,
            'delta': d
          })
        }
        else{
          this.topLosers.push({
            'stockId': sid,
            'delta': d
          })
        }
        
      } catch (error) {
        console.log(`Error fetching : ${this.priceType} of ${sid}`)
      }
      
    });

    this.topGainers.sort((a, b) => -1*(a.delta - b.delta))
    this.topLosers.sort((a, b) => (a.delta - b.delta))
    
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
      let marked = []

      for(let stock of stocks){
        if(marked.indexOf(stock.stock_id) != -1)
          continue
        
        marked.push(stock.stock_id)
        stockChunk.push(stock)
        if(stockChunk.length == chunkSize){
          await this.stockService.updateStockDetails(stockChunk, []).toPromise();
          stockChunk = []
          currentChunkIndex += 1
          this.currentProgress = currentChunkIndex * 100 / (stocks.length/chunkSize)
        }
      }

      if(stockChunk.length > 0){
        await this.stockService.updateStockDetails(stockChunk, []).toPromise();
      }

      // this.brDetails = []
      // this.pagedFiltered['brDetails'] = []
      // this.getBrokerRatings(1)
      // this.changePortfolio(this.activePortfolio)

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

  drawPortfolioAllocation(sectorData) {

    let chartOptions = {
      chart: {
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
        type: 'pie',
        width: 650,
        height: 400,
      },
      responsive: {
        rules: [{
            condition: {
                maxWidth: 500
            },
            chartOptions: {
                legend: {
                    layout: 'horizontal',
                    align: 'center',
                    verticalAlign: 'bottom'
                }
            }
        }]
      },
      title: {
        text: 'Sectorwise Allocation'
      },
      tooltip: {
          pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
      },
      accessibility: {
          point: {
              valueSuffix: '%'
          }
      },
      plotOptions: {
          pie: {
              size: 200,
              center: [300, 150],
              allowPointSelect: true,
              cursor: 'pointer',
              dataLabels: {
                alignTo: 'plotEdges',
                enabled: true,
                connectorShape: 'crookedLine',
                crookDistance: '70%',
                format: '<b>{point.name}</b>: {point.percentage:.1f} %'
              }
          }
      },
      series: [{
          name: 'Sector',
          colorByPoint: true,
          data: sectorData
        }]
      }
      
      Highcharts.chart('sector-allocation', chartOptions as Highcharts.Options)

  }

  drawPriceHistory(priceVolume, maxVolume, stockName, div) {
    let chartOptions = {
      chart: {
        type: 'line'
      },
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
        max: 5*maxVolume
      }],

      plotOptions: {
        series: {
            marker: {
                enabled: false
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
  
    Highcharts.chart(div, chartOptions as Highcharts.Options)
  }

  drawStockTrend(){
    // console.log(this.currentPFStockValue)
    let chartOptions = {
      title: {
        text: 'Price Trend'
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

      series: this.currentStockValue
    }

    Highcharts.chart('stock-trend', chartOptions as Highcharts.Options)
  }

  drawPortfolioTrend(data, title='Portfolio Trend', selector='portfolio-trend') {

    // console.log(this.currentPFStockValue)
    let chartOptions = {
      title: {
        text: title
      },

      xAxis: {
        'type': 'datetime',
        title: {
          text: 'Date'
        }
      },

      yAxis: [
        {
          title: {
            text: 'Value'
          }
        },
        {
          title: {
            text: 'Point'
          },
          opposite: true
        },

      ],

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

      series: data
    }
  
    Highcharts.chart(selector, chartOptions as Highcharts.Options)
  }

  drawInvTrend(data, chart_type='column', title='Investment Trend', selector='inv-trend', plotOptions) {
    console.log(data)
    let chartOptions = {
      chart: {
        type: chart_type
      },
      title: {
        text: title
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

      "plotOptions": plotOptions,

      tooltip: {
        shared: true,
        crosshairs: true
      },
  
      series: data
    }
  
    Highcharts.chart(selector, chartOptions as Highcharts.Options)
  }
}




export interface DialogData {
  portfolioName: string;
  portfolioType: string;
}

@Component({
  selector: 'dialog-new-pf',
  templateUrl: 'dialog-new-pf.html',
})
export class DialogNewPF {

  types = ['VIRTUAL', 'VIRTUAL_OPTION']

  constructor(
    public dialogRef: MatDialogRef<DialogNewPF>,
    private portfolioService: PortfolioService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

  addNewPF(portfolioName) {
    this.portfolioService.addNewPortfolio(this.data.portfolioName, this.data.portfolioType).subscribe(data => {
      console.log(data)
    })
  }

}