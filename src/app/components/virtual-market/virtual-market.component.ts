import { Component, OnInit, Inject } from '@angular/core';
import { PortfolioService } from '../../services/portfolio.service';
import { StockService } from '../../services/stock.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as Highcharts from 'highcharts';
import { Investment } from '../../models/Investment'
import { ChangeDetectorRef } from '@angular/core';
import { FilterPipe } from '../../pipes/filter.pipe'
import {animate, state, style, transition, trigger} from '@angular/animations';


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
  historyLB = 60;
  priceType = "stock_price_close"
  expandedStockId = -1;
  liveTrack = false;
  fileToUpload = null

  activePortfolio = null;
  portfolioDetails = null;
  portfolioInvestments = null;
  investmentDetails = [];
  filterPipe = null;
  

  stockDetails = [];
  dealDetails = [];
  divDetails = [];
  agmDetails = [];
  bmDetails = [];
  insDetails = [];
  brDetails = [];
  newsDetails = [];

  stockAutoCompleteList = [];
  stockAutoCompleteTO = null;
  displayedColumnsInner = [
    'price','qty', 'cost', 'date', 'action'
  ]
  displayedColumnsPortfolio = [
    'stock_name', 'stock_sector', 'quantity', 'perShareCostPrice', 
    'perShareCurrentPrice', 'cost', 
    'market_value', 'pL', 'change', '5yfd', 'perShareProjectedPrice', 'perShareProjectedPerc', 'pPL', 'action'
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
    this.newInvestment.inv_date = (today.getMonth()+1)+'/'+today.getDate()+'/'+today.getFullYear();
    this.filterPipe = new FilterPipe()
    // this.changePortfolio(1)
  }

  ngOnDestroy(): void{
    if(this.liveTrackInterval != null)
      clearInterval(this.liveTrackInterval)
  }


  getAllIndices(){
    this.stockService.getAllIndices().subscribe(data => {
      this.indices = data['indices']
      console.log(this.indices)
    })
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
      let stk_obj = this.getStockFromId(inv.inv_stock_id)
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

  changePortfolio(portfolioId) {
    if (!isNaN(portfolioId)) {
      this.liveTrack = false;
      this.activePortfolio = parseInt(portfolioId);
      console.log(`Portfolio changed to ${this.activePortfolio}`);

      this.portfolioService.getPortfolioById(this.activePortfolio).subscribe(data => {
        // console.log(data)
        this.portfolioDetails = data['portfolio']
        this.stockDetails = data['stocks']
        this.portfolioInvestments = data['investments']
        this.investmentDetails = this.aggInvestment(data['investments']);
        
        this.getPriceHistoryForPortfolio(this.activePortfolio, this.historyLB);

        
        // console.table(this.portfolioInvestments)
        // console.table(this.stockDetails)
        
        this.getDeals();
        this.getDividends();
        this.getAGM();
        this.getBM();
        this.getInsider();
        this.getBrokRes();
        this.getNews();

        setTimeout( () => {
          this.getSectorWiseAllocation(this.investmentDetails, this.portfolioDetails['value_invested'])
          this.getInvTrend()
        }, 1000)
        
        
      })
    }
  }

  getInvTrend(){
    this.portfolioService.getPortfolioTrendById(this.activePortfolio).subscribe(resp => {
      // console.log(resp)
      let data = []
      resp['data'].forEach(item => {
        data.push(
          [
            Date.parse(item['date']),
            item['amount']
          ]
        )
      });

      let trend = [{
        'name': 'Purchases',
        'data': data
      }]
  
      this.drawInvTrend(trend)

    });
  }

  getSectorWiseAllocation(investmentDetails, totalValue){
    let sectorData = []
    let sectors = {}
    
    investmentDetails.forEach(each => {
      // console.log(each)
      let sector = this.getStockFromId(each.inv_stock_id).stock_category
      // console.log(this.getStockFromId(each.inv_stock_id))
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
      console.log("Delete Successful!")
      this.getLatestPFs()
      this.portfolioDetails = null;
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
        }, 60000)
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
      let inv = JSON.parse(JSON.stringify(investmentDetails[i]))
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
    
  async updateStockDetails(){
    this.refreshInProgress = true;
    let chunksize = 2
    let items = []
    for(let i=0; i<this.stockDetails.length;i++){
    
      items.push(this.stockDetails[i])
      if(items.length >= chunksize)
      {
        try{
          await this.stockService.updateStockDetails(items, []).toPromise()
        }
        catch(error){
          console.log(error)
        }
        finally{
          this.currentProgress = (i+1)*100/this.stockDetails.length
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
    this.changePortfolio(this.activePortfolio)

  }

  getFloatFromLocale(numStr){
    return parseFloat(numStr.replace(',', ''))
  }


  getStockFromId(stockId){
    for(let i=0;i<this.stockDetails.length;i++){
      let stock = this.stockDetails[i]
      if(stock.stock_id == stockId)
        return stock
    }
    return {
      'stock_name': ""
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
    if(this.stockDetails.length > 0)
      this.stockService.getBrokResforStocks(this.stockDetails).subscribe(data => {
        // console.table(data['deals'])
        this.brDetails = data['broker-research']
        this.pagedFiltered['brDetails'] = this.brDetails.slice(0, 30)
      })
  }

  getAGM(){
    this.agmDetails = []
    if(this.stockDetails.length > 0)
      this.stockService.getAGMforStocks(this.stockDetails).subscribe(data => {
        // console.table(data['deals'])
        this.agmDetails = data['agm']
        this.pagedFiltered['agmDetails'] = this.agmDetails.slice(0, 30)
      })
  }

  getNews(){
    this.newsDetails = []
    if(this.stockDetails.length > 0)
      this.stockService.getNewsforStocks(this.stockDetails).subscribe(data => {
        // console.table(data['deals'])
        this.newsDetails = data['news']
        this.pagedFiltered['newsDetails'] = this.newsDetails.slice(0, 30)
        // console.table(this.newsDetails)
      })
  }

  getDeals(){
    this.dealDetails = []
    if(this.stockDetails.length > 0)
      this.stockService.getDealsforStocks(this.stockDetails).subscribe(data => {
        // console.table(data['deals'])
        this.dealDetails = data['deals']
        this.pagedFiltered['dealDetails'] = this.dealDetails.slice(0, 30)

      })
  }

  getInsider(){
    this.insDetails = []
    if(this.stockDetails.length > 0)
      this.stockService.getInsforStocks(this.stockDetails).subscribe(data => {
        // console.table(data['deals'])
        this.insDetails = data['insider']
        this.pagedFiltered['insDetails'] = this.insDetails.slice(0, 30)
      })
  }

  getBM(){
    this.bmDetails = []
    if(this.stockDetails.length > 0)
      this.stockService.getBMforStocks(this.stockDetails).subscribe(data => {
        // console.table(data['deals'])
        this.bmDetails = data['bm']
        this.pagedFiltered['bmDetails'] = this.bmDetails.slice(0, 30)
      })
  }

  getDividends(){
    this.divDetails = []
    if(this.stockDetails.length > 0)
      this.stockService.getDividendForStocks(this.stockDetails).subscribe(data => {
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

  async getLivePriceHistoryForPortfolio(priceType="stock_price_close"){
    let liveStockPH = {}
    let currentLivePFStockValue = []
    let max_len = -1
    let marked = []
    for(let i=0; i<this.stockDetails.length;i++){
      let stk = this.stockDetails[i]
      if(marked.indexOf(stk.stock_id) == -1){
      
        let data = await this.stockService.getPriceHistory(stk.stock_id, 1).toPromise()
      
        liveStockPH[stk.stock_id] = data['price_history']

        if(max_len == -1){
          max_len = data['price_history'].length
        }

        if(data['price_history'].length < max_len)
          max_len = data['price_history'].length

        marked.push(stk.stock_id)
      }
        

      // console.table(data)
    }


      
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
    let currentEpoch = Date.parse(date.toDateString()) + 9*60*60000
    console.log(currentEpoch)

    this.investmentDetails.forEach((investment, index) => {
      let dataLive = []
      liveStockPH[investment.inv_stock_id].forEach((ph, index) => {
        if(index >= max_len)
          return
        dataLive.push(
          [
            index*60000+currentEpoch,
            investment.inv_stock_qty * ph[priceType],
            // investment.inv_stock_qty * investment.inv_stock_cost_per_share
          ]
        )

        totalLive = updateTotal(
          totalLive, index*60000+currentEpoch, 
          investment.inv_stock_qty * ph[priceType]
        )

      });

      let color = this.getRandomColors(inColors)
      inColors.push(color)
      currentLivePFStockValue.push({
        'name': this.getStockFromId(investment.inv_stock_id).stock_name,
        'data': dataLive,
        'color': color,
        // 'visible': firstSelected?true:false
        'visible': false
      })


    });

    let color = this.getRandomColors(inColors)
    inColors.push(color)
    currentLivePFStockValue.push({
      'name': 'Total',
      'data': totalLive,
      'color': color,
    })


      
    

    this.drawPortfolioTrend(currentLivePFStockValue, 'Portfolio Trend - LIVE', 'portfolio-trend-live')

  }

  getPriceHistoryForPortfolio(portfolioId, lookBack=30, priceType="stock_price_close") {
    this.portfolioService.getPriceHistoryForPortfolio(portfolioId, lookBack).subscribe(data => {
      this.stockPriceHistory = []
      let priceHistory: any = data['price_history'];
      // console.log(priceHistory)
      let stockIds = Object.keys(priceHistory)
      stockIds.forEach(stockId => {
        this.stockPriceHistory[stockId] = priceHistory[stockId]
      })

      this.changeStock(stockIds[0])
      
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

      this.getGainersLosers(lookBack)

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

      let populateIndices = async (lookBack, priceType, inColors)  => {
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
    let stock = this.getStockFromId(stockId)
    if(this.currentStockValue.length > 0){
      if(this.currentStockValue[this.currentStockValue.length - 1].name == stock.stock_name)
        return
    }
    this.currentStockValue = []
    let dataLive = []
    let stockName = stock.stock_name
    this.stockPriceHistory[stockId].forEach(item => {
      dataLive.push([
        Date.parse(item.stock_price_date),
        item[this.priceType]
      ])
    });

    this.currentStockValue.push({
      'name': stockName,
      'data': dataLive,
      'visible': true
    })
  
    this.drawStockTrend()
  }

  getGainersLosers(lookBack){
    this.topGainers = []
    this.topLosers = []
    
    let stockIds = Object.keys(this.stockPriceHistory)
    stockIds.forEach(sid => {
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

  drawInvTrend(data, title='Investment Trend', selector='inv-trend') {
    // console.log(data)
    let chartOptions = {
      chart: {
        type: 'column'
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