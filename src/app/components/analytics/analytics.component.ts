import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {FormControl} from '@angular/forms';
import { StockService } from '../../services/stock.service';
import * as Highcharts from 'highcharts';

import { FilterPipe } from '../../pipes/filter.pipe'

export class Stock{
  stock_name: string = "";
  stock_category: string = "";
  stock_id: number = null;

  constructor(){}
}
@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.sass']
})
export class AnalyticsComponent implements OnInit {

  @ViewChild('phmode') phmodeTab: ElementRef;

  stockAutoCompleteList = []
  stockAutoCompleteTO = null;
  topChangersTO =  null;
  topValueTO = null;
  valuePicksTO = null;
  livePriceInterval = null
  filterPipe = null;

  agmDetails = []
  dealDetails = []
  divDetails = []
  bmDetails = []
  insDetails = []
  topMFStocks = []
  newsDetails = []
  quarterDetails = []
  brokerRatings = {}
  competitionDetails = [];
  brDetails = [];

  topGainers = []
  topLosers = []
  topValue = []

  equityMetric = "latest"
  stockMaxPrice = 3000

  refreshInProgress = false

  currentStock: Stock;
  priceHistory = [];
  currentProgress = 0;
  
  
  allSectors = [];
  selectedSectors = [];
  TOP_N = 100;

  
  @ViewChild('selectedOptions') selectedOptions;
  // selectedSectors = []

  sectorKW = "";
  eventKW = "";

  historyLB = 30;
  changeLB = 1
  allStocks = []

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
      'stockName', 'organization', 'flag', 'recDate', 'curPrice', 'recPrice', 'targetPrice', 'margin', 'valid_flag', 'check_flag'
    ],
    'news': [
      'stockName', 'curPrice', 'newsDate', 'newsHead'
    ]
  }

  pagedFiltered = {
    'brDetails': [],
    'insDetails': [],
    'dealDetails': [],
    'agmDetails': [],
    'newsDetails': []
  }

  

  valuePicks = {}
  commonStocks = new Set()

  constructor(
    private stockService: StockService,
  ) { }

  // public ngAfterViewInit(): void {
  //   console.log(this.phmodeTab.nativeElement)
  // }

  ngOnInit(): void {
    this.currentStock = new Stock()
    this.filterPipe = new FilterPipe()
    
    this.getAllStocks()
    this.getSectors()
    this.getTopChangers()
    this.getTopValue()
    
  }

  ngOnDestroy(): void{
    if(this.livePriceInterval != null)
      clearInterval(this.livePriceInterval)
  }

  filterDataWithPipe(array, keyword, id_){
    if(keyword.length == 0)
      return array
    return this.filterPipe.transform(array, keyword, this.allStocks, id_)
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

  getTopValue(){

    if(this.topValueTO != null)
     clearInterval(this.topValueTO)

    this.topValue = []

    this.topValueTO = setTimeout(() => {
      
      this.stockService.getTopChangers(-1, 'topvalue').subscribe( data => {
        this.topValue = data['topvalue']
        this.topValue = this.topValue.filter(
          (item) => {
            let stockObj = this.getStockFromId(item.stock_id)
            return stockObj.stock_current_price <= this.stockMaxPrice?true:false
          }
        )
        this.topValue.sort((a, b) => b.mean_profit - a.mean_profit)
      })
    }, 1000)

  }

  getTopChangers(){

    if(this.topChangersTO != null)
     clearInterval(this.topChangersTO)

    this.topGainers = []
    this.topLosers = []

    this.topChangersTO = setTimeout(() => {
      this.stockService.getTopChangers(this.changeLB, 'toplosers').subscribe( data => {
        this.topLosers = data['toplosers']
        this.topLosers = this.topLosers.filter(
          (item) => {
            let stockObj = this.getStockFromId(item.stock_id)
            return stockObj.stock_current_price <= this.stockMaxPrice?true:false
          }
        )
      })
      this.stockService.getTopChangers(this.changeLB, 'topgainers').subscribe( data => {
        this.topGainers = data['topgainers']
        this.topGainers = this.topGainers.filter(
          (item) => {
            let stockObj = this.getStockFromId(item.stock_id)
            return stockObj.stock_current_price <= this.stockMaxPrice?true:false
          }
        )
      })
    }, 500)
      
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

  toggleBrokerRes(brokres_id){
    console.log("Toggling "+brokres_id)
    this.stockService.updateBrokresValidity(brokres_id).subscribe(data => {
      let obj = data['brokres_validity_update'][0]
      this.brDetails.forEach(item => {
        if(item.brokres_id == brokres_id){
          item.brokres_rec_valid_flag = !item.brokres_rec_valid_flag
        }
      })
    })
  }

  checkBrokerRes(brokres_id){
    console.log("Checking "+brokres_id)
    this.stockService.checkBrokres(brokres_id).subscribe(data => {
      let changed = data['brokres_stock_check_update'][0]
      console.log(changed)
      if(changed){
        this.getBrokRes()
      }
      // this.brDetails.forEach(item => {
      //   if(item.brokres_id == brokres_id){
      //     item.brokres_rec_valid_flag = !item.brokres_rec_valid_flag
      //   }
      // })
    })
  }

  updateStockDetails(updateList){

    this.stockService.updateStockDetails([this.currentStock], updateList).subscribe( data => {
      this.getPriceHistory()
    })
  }


  updateAllStocks(updateList=[]){
    this.refreshInProgress = true;
    if(updateList.length == 0)
      updateList = [
        'insider-transaction',
        'income-statement',
        // 'income-statement-standalone',
        'balance-sheet',
        'ratios',
        'cash-flow',
        'price-history',
        'dividends',
        'board-meetings',
        'annoucements',
        'agm-egm',
        'broker-research',
        'block-deals',
        'bulk-deals',
        'quarterly-results',
        'shareholding',
        // 'broker-research-2',
        'news'
      ]
    this.stockService.getAllStocksDetails().subscribe( async data => {
      let stocks = data['stocks'];
      console.table(stocks.length)
      let stockChunk = []
      let chunkSize = 10
      let currentChunkIndex = 0

      stocks = stocks.sort(
        (a, b) =>  {
          return a.stock_price_update_datetime > b.stock_price_update_datetime ? 1 : -1
        }
      )

      console.table(stocks.slice(0, 20))

      for(let stock of stocks){
        stockChunk.push(stock)
        
        if(stockChunk.length == chunkSize){
          try {
            await this.stockService.updateStockDetails(stockChunk, updateList).toPromise();
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
        await this.stockService.updateStockDetails(stockChunk, updateList).toPromise();
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
      if(actionKey.indexOf('brokres')!=-1){
        if(dataArray[i]['brokres_rec_valid_flag'] == false)
          continue
      }
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
    this.getStocksBySector()
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
    
    let stockName: String = event.target.value
    if (this.stockAutoCompleteTO != null) {
      clearTimeout(this.stockAutoCompleteTO)
    }
    if (stockName.length == 0)
      return

    this.stockAutoCompleteTO = setTimeout(() =>
      this.stockService.getStockByName(stockName).subscribe(data => {
        this.stockAutoCompleteList = data['stocks']
      }),
      500
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
    if(this.currentStock['stock_id'] != null)
      this.getPriceHistory()
  }

  getAnalytics(){
      // this.getLivePriceHistory()
      setTimeout(() => {
        this.getQuarterly();
        this.getCompetition();
        this.getPriceBand();
        this.changePriceTab()
      }, 2000)
  }

  getPriceBand(){
    //get prices from deals, insider and br
    let priceBands = {
      'deals-buy': [],
      'insider-buy': [],
      'deals-sell': [],
      'insider-sell': [],
      'br': [],
    }

    this.dealDetails.filter(item => item['deal_stock_id'] == this.currentStock.stock_id).forEach(item => {
      if(item['deal_trans_type']=='Purchase')
        priceBands['deals-buy'].push(parseFloat(item['deal_price']))
      else if(item['deal_trans_type']=='Sell')
        priceBands['deals-sell'].push(parseFloat(item['deal_price']))
    })

    this.insDetails.filter(item => item['ins_stock_id'] == this.currentStock.stock_id).forEach(item => {
      if(item['ins_action']=='Acquisition')
        priceBands['insider-buy'].push(parseFloat(item['ins_price']))
      else  if(item['ins_action']=='Disposal')
        priceBands['insider-sell'].push(parseFloat(item['ins_price']))
    })

    // console.table(this.brDetails.filter(item => item['brokres_stock_id'] == this.currentStock.stock_id))

    this.brDetails.filter(item => item['brokres_stock_id'] == this.currentStock.stock_id).forEach(item => {
      if(item['brokres_rec_flag']=='BUY' && item['brokres_rec_valid_flag'])
        priceBands['br'].push(parseFloat(item['brokres_target']))
    })

    this.drawPriceBand(priceBands, this.currentStock)

  }

  changePriceTab(){
    let tabIndex = this.phmodeTab['selectedIndex']

    if(this.livePriceInterval != null)
      clearInterval(this.livePriceInterval)

    switch (tabIndex){
      case 1: this.getLivePriceHistory()
        break;
      default: this.getPriceHistory()
        break;
    }
  }

  getLivePriceHistory(){
    if(this.livePriceInterval != null)
      clearInterval(this.livePriceInterval)

    let date = new Date()
    if(date.getDay() == 0 || date.getDay() == 6){
      alert("Market Holiday")
      return
    }
      
    let updatePrice = () => {

      this.stockService.getPriceHistory(this.currentStock.stock_id, 1).subscribe(data => {
        
        let prices = []
        let volumes = []
        let maxVolume = 0;
        let delta = parseInt(data['delta'])
        // console.table(data['price_history'])
        let timedelta = 9*60*60*1000
        data['price_history'].forEach(item => {
          prices.push(
            [
              new Date().setTime(Date.parse(item.stock_price_date) + timedelta),
              item.stock_price_close
            ]
          )
          volumes.push(
            [
              new Date().setTime(Date.parse(item.stock_price_date) + timedelta),
              item.stock_price_volume
            ]
          )

          if(maxVolume < item.stock_price_volume)
            maxVolume = item.stock_price_volume
          
          timedelta += (delta*60*1000)
        });

        let priceVolume = [{
          'name': 'Price',
          'data': prices
          
        },{
          'name': 'Volume',
          'data': volumes,
          'type': 'area',
          'yAxis': 1,
          // 'pointWidth': Math.max(1, 240.0/volumes.length)
        }
      ]
        this.drawPriceHistory(priceVolume, maxVolume, this.currentStock.stock_name + " (Live)", "price-history-live");
      });
    }

    updatePrice()
    if(date.getHours() < 16 && date.getHours() > 9)
      this.livePriceInterval = setInterval(updatePrice, 1000*60)
    else
      console.log("No refresh after market hrs")
  }

  getPriceHistory(){
    this.stockService.getPriceHistory(this.currentStock.stock_id, this.historyLB).subscribe(data => {
      
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
        'type': 'area',
        'yAxis': 1,
        // 'pointWidth': Math.max(1, 240.0/volumes.length)
      }
    ]
      this.drawPriceHistory(priceVolume, maxVolume, this.currentStock.stock_name, "price-history");
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
        // console.log(`Metric : ${this.equityMetric}`)
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
        'yAxis': 2,
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

  getLen(objList){
    return objList.length
  }

  getAGM(){
    this.agmDetails = []

    this.stockService.getAGMforStocks().subscribe(data => {
      // console.table(data['deals'])
      this.agmDetails = data['agm']
      this.agmDetails = this.agmDetails.filter(
        (item) => {
          let stockObj = this.getStockFromId(item.agm_stock_id)
          return stockObj.stock_current_price <= this.stockMaxPrice?true:false
        }
      )
      this.pagedFiltered['agmDetails'] = this.agmDetails.slice(0, 30)
    })
  }

  getNews(){
    this.newsDetails = []

    this.stockService.getNewsforStocks().subscribe(data => {
      // console.table(data['deals'])
      this.newsDetails = data['news']
      this.newsDetails = this.newsDetails.filter(
        (item) => {
          let stockObj = this.getStockFromId(item.news_stock_id)
          return stockObj.stock_current_price <= this.stockMaxPrice?true:false
        }
      )

      this.pagedFiltered['newsDetails'] = this.newsDetails.slice(0, 30)
    })
  }



  getDeals(){
    this.dealDetails = []

    this.stockService.getDealsforStocks().subscribe(data => {
      // console.table(data['deals'])
      this.dealDetails = data['deals']
      this.dealDetails = this.dealDetails.filter(
        (item) => {
          let stockObj = this.getStockFromId(item.deal_stock_id)
          return stockObj.stock_current_price <= this.stockMaxPrice?true:false
        }
      )
      let dealCounts = this.getDistribution(this.dealDetails)
      
      // console.log(dealCounts)
      let dataSeries = []
      Object.keys(dealCounts['Purchase']).forEach(it => {
        let stockObj = this.getStockFromId(it)
        if(stockObj.stock_current_price <= this.stockMaxPrice)
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
      this.pagedFiltered['dealDetails'] = this.dealDetails.slice(0, 30)

    })
  }

  getIns(){
    this.insDetails = []

    this.stockService.getInsforStocks().subscribe(data => {
      // console.table(data['deals'])
      this.insDetails = data['insider']
      this.insDetails = this.insDetails.filter(
        (item) => {
          let stockObj = this.getStockFromId(item.ins_stock_id)
          return stockObj.stock_current_price <= this.stockMaxPrice?true:false
        }
      )
      this.pagedFiltered['insDetails'] = this.insDetails.slice(0, 30)

    })
  }

  getBM(){
    this.bmDetails = []
   
    this.stockService.getBMforStocks().subscribe(data => {
      // console.table(data['deals'])
      this.bmDetails = data['bm']
      this.bmDetails = this.bmDetails.filter(
        (item) => {
          let stockObj = this.getStockFromId(item.bm_stock_id)
          return stockObj.stock_current_price <= this.stockMaxPrice?true:false
        }
      )
      this.pagedFiltered['bmDetails'] = this.bmDetails.slice(0, 30)
      // console.log(this.pagedFiltered['bmDetails'])

    })
  }

  getAvg(nums: []){
    const total = nums.reduce((acc, c) => acc + c, 0)
    return Math.round(total/nums.length)
  }

  getBrokerRatings(){
    this.stockService.getBrokerRatings().subscribe(data => {
      this.brokerRatings = data['brokerrating'][0]
      
      let brokers = Object.keys(this.brokerRatings)
      for(let i=0; i<brokers.length;i++){
        let br = brokers[i]
        this.brokerRatings[br]['min_date_diffs'] = Math.min(...this.brokerRatings[br]['date_diffs'])
        this.brokerRatings[br]['max_date_diffs'] = Math.max(...this.brokerRatings[br]['date_diffs'])
        this.brokerRatings[br]['mean_date_diffs'] = this.getAvg(this.brokerRatings[br]['date_diffs'])

      }
      console.log(this.brokerRatings)
      this.getBrokRes();
    })
  }

  updateValuePicks(){
    if(this.valuePicksTO != null)
      clearTimeout(this.valuePicksTO)
    this.valuePicksTO = setTimeout(() => {
      this.getDeals()
      this.getBrokRes()
      this.getTopMFHoldings()
      this.getIns();
      this.getNews();
      this.getTopChangers();
      this.getTopValue();
      this.getBM();
      this.getAGM();
      this.getDividends();
    }, 1500)
    
  }

  getTopMFHoldings(){
    this.topMFStocks = []
    this.stockService.getTopMFHoldings().subscribe(data => {
      console.log(data)
      this.topMFStocks = data['topmfholdings']
      let dataSeries = []
      this.topMFStocks.forEach(item => {
        let stockObj = this.getStockFromId(item.stock_id)
        if(stockObj.stock_current_price <= this.stockMaxPrice)
          dataSeries.push({
            'name': stockObj.stock_name,
            'data': [item['#mfs']]
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
      // console.table(data['broker-research'])
      this.brDetails = data['broker-research']
      this.brDetails = this.brDetails.filter(
        (item) => {
          let stockObj = this.getStockFromId(item.brokres_stock_id)
          return stockObj.stock_current_price <= this.stockMaxPrice?true:false
        }
      )
      let brCounts = this.getDistribution(this.brDetails, 'brokres_rec_flag', 'brokres_stock_id')
      
      // console.log(brCounts)
      let dataSeries = []
      Object.keys(brCounts['BUY']).forEach(it => {
        let stockObj = this.getStockFromId(it)
        if(stockObj.stock_current_price <= this.stockMaxPrice)
          dataSeries.push(
            {
              'name': stockObj.stock_name,
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
      this.pagedFiltered['brDetails'] = this.brDetails.slice(0, 30)
    })
  }

  getDividends(){
    this.divDetails = []

    this.stockService.getDividendForStocks().subscribe(data => {
      // console.table(data['dividends'])
      this.divDetails = data['dividends']
      this.divDetails = this.divDetails.filter(
        (item) => {
          let stockObj = this.getStockFromId(item.div_stock_id)
          return stockObj.stock_current_price <= this.stockMaxPrice?true:false
        }
      )
      this.pagedFiltered['divDetails'] = this.divDetails.slice(0, 30)
      console.log(this.pagedFiltered['divDetails'])

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
      this.getBrokerRatings()
      
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
                radius: 3,
                states: {
                    hover: {
                        enabled: true,
                        lineColor: 'rgb(100,100,100)'
                    }
                }
            },
            // states: {
            //     hover: {
            //         marker: {
            //             enabled: false
            //         }
            //     }
            // },
            tooltip: {
                headerFormat: '<b>{series.name}</b><br>',
                pointFormat: 'Profit {point.y} Cr, Price Rs.{point.x}'
            }
        }
    },

      // tooltip: {
      //   shared: true,
      //   crosshairs: true
      // },

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

  getCount(arr: Array<Number>, value: Number){
    let count = 0
    arr.forEach(item => {
      if(item == value)
        count += 1
    })
    return count
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

  drawPriceBand(priceBands, stock, divId="price-bands") {

    let priceCategories = []

    Object.keys(priceBands).forEach(item => {
      priceBands[item].forEach(element => {
        if(priceCategories.indexOf(element) == -1)
          priceCategories.push(element)
      });
    })

    
    if(priceCategories.indexOf(stock['stock_current_price']) == -1)
      priceCategories.push(stock['stock_current_price'])
    
    console.log(priceCategories)
    console.log(stock)
    priceCategories.sort((a,b) => b-a)

    // console.log(priceCategories)

    // let tempPC = []
    // let start = Math.round(priceCategories[0] + 1)
    // priceCategories.forEach(p => {
    //   while(start>p){
    //     tempPC.push(start)
    //     start -= 1
    //   }
    //   tempPC.push(p)
    //   start = Math.round(p-1)
    // })

    // priceCategories = tempPC.sort((a,b) => b-a)

    // console.log(stock)
    // console.log(priceCategories)

    let dataSeries = [
      {
        name: 'Insider-SELL',
        data: []
      },
      {
        name: 'Deals-SELL',
        data: []
      },
      {
        name: 'Insider-BUY',
        data: []
      },
      {
        name: 'Deals-BUY',
        data: []
      },
      {
        name: 'Current',
        data: [],
        // dashStyle: 'dash',
      },
      {
        name: 'BrokerResearch',
        data: []
      }
    ]


    priceCategories.forEach(i => {
      if(priceBands['insider-sell'].indexOf(i)!=-1)
        dataSeries[0]['data'].push(this.getCount(priceBands['insider-sell'],i))
      else
        dataSeries[0]['data'].push(0)
      
      if(priceBands['deals-sell'].indexOf(i)!=-1)
        dataSeries[1]['data'].push(this.getCount(priceBands['deals-sell'],i))
      else
        dataSeries[1]['data'].push(0)

      if(priceBands['insider-buy'].indexOf(i)!=-1)
        dataSeries[2]['data'].push(this.getCount(priceBands['insider-buy'],i))
      else
        dataSeries[2]['data'].push(0)
      
      if(priceBands['deals-buy'].indexOf(i)!=-1)
        dataSeries[3]['data'].push(this.getCount(priceBands['deals-buy'],i))
      else
        dataSeries[3]['data'].push(0)
      
      if(priceBands['br'].indexOf(i)!=-1)
        dataSeries[5]['data'].push(this.getCount(priceBands['br'],i))
      else
        dataSeries[5]['data'].push(0)
      
      if(stock.stock_current_price == i)
        dataSeries[4]['data'].push(1)
      else
        dataSeries[4]['data'].push(0)
    })

    let chartOptions = {
    chart: {
        type: 'bar'
      },
      title: {
        text: "Price Band "+stock['stock_name']
      },
      legend: {
          enabled: true
      },
      xAxis: {
        categories: priceCategories
      },

      yAxis: {
        labels: {
          overflow: 'justify'
        }
      },
      
      plotOptions: {
        series: {
          marker: {
              enabled: true
          },
        }
      },

      series: dataSeries
    }
  
    Highcharts.chart(divId, chartOptions as Highcharts.Options)
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

  updateCommonData(){
    this.stockService.fetchCommonData().subscribe(data => {
      console.log("Updated Common Data");
      this.updateValuePicks()
    })
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
}



