import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {FormControl} from '@angular/forms';
import { StockService } from '../../services/stock.service';
import * as Highcharts from 'highcharts';
import {MatSnackBar} from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService} from 'ngx-toastr';
import { Stock } from '../analytics/analytics.component';
import { Investment } from '../../models/Investment';
import { MatTabChangeEvent } from '@angular/material/tabs/tab-group';
import { Container } from '@angular/compiler/src/i18n/i18n_ast';
import { FilterPipe } from '../../pipes/filter.pipe'; 
import { DialogData, DialogNewPF } from '../virtual-market/virtual-market.component';
import { PortfolioService } from 'src/app/services/portfolio.service';


export const colorBL = "green"
export const colorBH = "orange"
export const colorMA = "black"
export const colorST = "violet"
export const colorMacd = "#3498DB"
export const colorMacdSignal = "#EC7063"
export const colorMacdHist = '#40E0D0'

export class Modal {
  public modalTitle: string;
  public modalProceedFunction = () => {
    console.log("model proceed function not defined")
  }; 

  constructor(title) {
    this.modalTitle = title;
  }

  public modalProceed() {
    this.modalProceedFunction()
  }
}

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.sass']
})
export class OptionsComponent implements OnInit {

  stockAutoCompleteList = []
  stockOptionsStrikePrice = []
  stockOptionsExpiry = []
  activeOptions: any[] = []
  optionBets: any[] = []
  stockAutoCompleteTO: any;
  currentStock: Stock;
  currentActiveOption: any
  optionType: "CE" | "PE"
  expiryDate: String;
  strikePrice: number;
  refreshInProgress = false
  activeTab = 'history'
  activePortId = 0

  prevPrices = {}
  optionAlert = {}

  liveTO: number | undefined = undefined;
  liveAllTO: any
  invLiveTO: any
  allStocks = []
  optionsInvs: any[] = []
  alertModal: Modal
  invToSell: any;

  activeHR = undefined
  expiredFlag = false;

  aoFilterValue=""
  aoFilterTO:any | undefined = undefined
  filteredAO:any[] = []

  optBetTO: number | undefined = undefined;

  livePriceInterval: number | undefined = undefined

  totalInvestment = 0
  unrealPL = 0
  unrealP = 0
  realPL = 0
  realPLD = 0
  projProfits:any = {};

  portfolios: any[] = [];
  optTypes: string[] = []
  
  today = new FormControl(new Date())

  txColumns = ['alert', 'optionName', 'qty', 'buyPrice', 'nowPrice', 'P/L', 'action']
  txSellColumns = ['optionName', 'qty', 'buyPrice', 'sellPrice', 'P/L', 'CP/L', 'action']

  activeStocks: any[] = []

  constructor(
    private stockService: StockService,
    private portfolioService: PortfolioService,
    private toastr: ToastrService,
    private newInvestment: Investment,
    public dialog: MatDialog,
  ) { }

  async ngOnInit(): Promise<any> {
    this.alertModal = new Modal("")
    this.currentStock = new Stock()
    await this.getAllStocks()
    await this.getLatestPFs()
    await this.getAllOptions()
    this.getOptionBets()

    
    // this.fetchAllLive()
  }

  resetStats() {
    this.unrealPL = 0
    this.unrealP = 0
    this.realPL = 0
    this.realPLD = 0
  }

  isExpired(option) {
    let date = Date.parse(option.opt_expiry_date)
    return date <= Date.now()
  }

  removeAPF() {
    this.portfolioService.removePortfolioById(this.activePortId).subscribe(data => {
      // console.log("Delete Successful!")
      this.getLatestPFs()
    })
  }

  async getLatestPFs() {
    let resp = await this.portfolioService.getAllPortfolios("VIRTUAL_OPTION").toPromise()
    this.portfolios = resp['portfolios'];
    this.activePortId = this.portfolios[0]['portfolio_id']
  }


  filterActiveOptions(activeOptions:any[], filterValue: string | null | undefined) {

    activeOptions = activeOptions.filter(option => !this.isExpired(option) || this.expiredFlag)
    if (filterValue === undefined || filterValue === ''){
      this.filteredAO = activeOptions
      return
    }
    this.filteredAO = activeOptions.filter(item => item['opt_symbol'].toLowerCase().indexOf(filterValue)!==-1)
  }

  getOptionBets() {
    if(this.optBetTO !== undefined) {
      clearInterval(this.optBetTO)
      this.optBetTO = undefined
    }

    let getBets = () => {
      this.stockService.getOptionsBet().subscribe(resp => {
        let data = resp['data']
        this.optionBets = data
        this.optionBets.forEach(o => {
          o.opt_last_price_live = o.opt_last_price
        })
        // console.table(data)
      })
    }

    getBets()

    this.optBetTO = setInterval(() => {
      getBets()
    }, 120*1000)
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

  drawHoldingsPieChart() {
    let categoryData:any = {}
      let holdInvs = this.filterInv(this.optionsInvs, 'HOLD')
      holdInvs.forEach(item => {

        let option = this.getOptionFromId(item.opt_id)
        let stock = this.getStockFromId(option.opt_stock_id)

        if(Object.keys(categoryData).indexOf(stock.stock_category) == -1)
          categoryData[stock.stock_category] = 0

        categoryData[stock.stock_category] += item.total_cost_price

      })
      this.drawPieChart(categoryData, "holdings_category_pie", "Category-wise Holding")
  }
  log(row) {
    console.log(row)
  }

  updateStats(enableAlert=true) {
    let prevunRealPL = this.unrealPL
    this.totalInvestment = 0
    this.unrealPL = 0
    this.unrealP = 0
    this.realPL = 0
    this.realPLD = 0

    this.filterInv(this.optionsInvs, 'HOLD').forEach(item => {
      this.totalInvestment += item.total_cost_price
      let d = this.getOptionFromId(item.opt_id)['opt_last_price_live']*item.total_qty - item.total_cost_price
      this.unrealPL += d
      if(d > 0)
        this.unrealP += d
    })



    this.filterInv(this.optionsInvs, 'SOLD').forEach(item => {
      this.realPL += item.total_sell_price - item.total_cost_price
      let date = new Date(item.sell_date)
      if(date.setHours(0,0,0,0) == this.today.value.setHours(0,0,0,0))
        this.realPLD += item.total_sell_price - item.total_cost_price
    })

    let diff = this.unrealPL - prevunRealPL

    if(prevunRealPL != 0 && Math.abs(diff) >= 3000 && enableAlert) {
      let sym = diff < 0 ? "-₹": "₹"
      this.toastr.info(
        "Value Change : "+sym+Math.abs(diff), 
        "Porfolio Alert ("+(new Date()).toTimeString()+')', 
        {
          disableTimeOut: true
        }
      )
      console.log("BEEEEEEEEEEEEEEEEP! " + diff)
      // /home/ranger/Projects/eyestock/EyeStock_UI/src/app/components/options/options.component.ts
      this.playBeep()
    }

  }

  playBeep() {
    let audio = new Audio('../../../../assets/elevator-chimenotification-ding-recreation-287560.mp3');
    audio.play();
  }

  sortAscending(nums: number[]) {
    nums.sort((a, b) => {
      if (a < b) {
        return -1;
      }
      else if(a > b)
        return 1
      return 0
    })
    // console.log(nums)
    return nums;
  }

  drawPL(){
    let dateProfit = {}
    // let dateBuy = {}
    // let dateSell = {}

    this.filterInv(this.optionsInvs, 'SOLD').forEach(item => {
      let value = Math.round(item.total_sell_price - item.total_cost_price)
      // todo fix the var names
      if(Object.keys(dateProfit).indexOf(item.sell_date) == -1)
        dateProfit[item.sell_date] = 0
      dateProfit[item.sell_date] += value

      // let svalue = Math.round(item.total_sell_price)
      // if(Object.keys(dateSell).indexOf(item.sell_date) == -1)
      //   dateSell[item.sell_date] = 0
      // dateSell[item.sell_date] += svalue

    })

    // this.filterInv(this.optionsInvs, 'HOLD').forEach(item => {
    //   let value = Math.round(item.total_cost_price)
    //   // todo fix the var names
    //   if(Object.keys(dateBuy).indexOf(item.buy_date) == -1)
    //     dateBuy[item.buy_date] = 0
    //   dateBuy[item.buy_date] += value
    // })

      

    let trend:any[] = [
      {
        'name': 'Profit/Loss',
        'data': []
      },
      // {
      //   'name': 'Buy',
      //   'data': [],
      //   'type': 'line'
      // }
    ]

    // Object.keys(dateBuy).forEach(x => {
    //   trend[1]['data'].push([
    //     Date.parse(x),
    //     dateBuy[x]
    //   ])
    // })

    // Object.keys(dateSell).forEach(x => {
    //   trend[2]['data'].push([
    //     Date.parse(x),
    //     dateSell[x]
    //   ])
    // })

    Object.keys(dateProfit).forEach(x => {
      trend[0]['data'].push([
        Date.parse(x),
        dateProfit[x]
      ])
    })

    let plotOptions = {
      'column': {
        'stacking': 'stream',
        'pointWidth': 15
      },

    }
    console.log(trend)
    
    this.drawInvTrend(trend, 'column', 'PL Trend', 'pl-trend', plotOptions)

  }

  drawInvTrend(data, chart_type='column', title='Investment Trend', selector='inv-trend', plotOptions) {
      // console.log(data)
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

  updateProfitProjection(inv) {
    let currentPerc = Math.max(
                        1, 
                        Math.floor((this.getOptionFromId(inv.opt_id).opt_last_price_live * inv.total_qty - inv.total_cost_price)*100/inv.total_cost_price)
                      )
    // let factor = 10 
    this.projProfits = []
    let profitMults = [-1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5];
    for(let m of profitMults) {
      let p = currentPerc*m
      this.projProfits[p] = {
        'profit': this.roundFloat(inv.total_cost_price*p/100),
        'perUnit': this.roundFloat(inv.total_cost_price*(1+(p/100))/inv.total_qty),
        'total': this.roundFloat(inv.total_cost_price*(1+(p/100))),
        'highlight': p === currentPerc
      }
    }
  }

  // getLen(arr) {
  //   return arr.length;
  // }

  getKeys(m) {
    return Object.keys(m);
  }

  getNumKeys(m) {
    return Object.keys(m).map(item => Number.parseFloat(item));
  }

  setNewInvestment() {
    this.newInvestment.inv_total_cost = Math.ceil(this.currentActiveOption.opt_mkt_lot * this.currentActiveOption.opt_last_price_live)
    this.newInvestment.inv_date = (this.today.value.getMonth()+1)+'/'+this.today.value.getDate()+'/'+this.today.value.getFullYear();
  }

  async getAllStocks(skipCache=0){
    
    this.allStocks = []
    let data = await this.stockService.getAllStocksDetails().toPromise()
    this.allStocks = data['stocks'];
    this.allStocks.forEach((item:any) => {
      item.stock_current_price_live = item.stock_current_price
    })
  }

  updateExpiredFlag(checked) {
    this.expiredFlag = checked
    // this.getAllOptions()
  }

  updateOptionType(checked, opt_type) {
    let index = this.optTypes.indexOf(opt_type)
    let optTypes = JSON.parse(JSON.stringify(this.optTypes))
    // console.log(index)
    if(!checked) {
      if(index !== -1) {
        optTypes.splice(index, 1)
      }
    }
    else {
      if(index === -1)
        optTypes.push(opt_type)
    }
    this.optTypes = optTypes
    // console.log(this.optTypes)
  }

  setSellInv(inv) {
    this.invToSell = inv
    this.invToSell.total_sell_price = Math.ceil(this.getOptionFromId(inv.opt_id)['opt_last_price_live'] * this.invToSell.total_qty)
    this.invToSell.sell_date = (this.today.value.getMonth()+1)+'/'+this.today.value.getDate()+'/'+this.today.value.getFullYear();
  }

  sellInvestment() {
    this.stockService.sellOptionInv(this.invToSell.id, this.invToSell.total_sell_price, this.invToSell.sell_date).subscribe(data => {
      this.toastr.success("investment sold...")
      this.getAllInvs()
    })
  }

  getStockFromId(stockId){
    // console.log(`Checking : ${stockId}`)
    for(let i=0;i<this.allStocks.length;i++){
      let stock:any = this.allStocks[i]
      if(Number.parseInt(stock.stock_id) === Number.parseInt(stockId))
        return stock
    }
    return {
      'stock_name': ""
    }
  }

  removeInvestment(inv_id) {
    if (confirm("Are you sure?"))
      this.stockService.deleteInvestment(inv_id).subscribe(data => {
        this.toastr.success("investment deleted...")
        this.getAllInvs();
      })
  }

  roundFloat(floatValue: Number) {
    if(floatValue == undefined)
      return "0"
    return Number(floatValue.toFixed(2)).toLocaleString();
  }

  setOptionType (optType) {
    this.optionType = optType;
  }

  getExpiryStrikePrice() {
    console.log("getting expiry dates...")
    this.stockService.getExpiryStrikePriceForStock(this.currentStock.stock_id).subscribe(data => {
      this.stockOptionsExpiry = data['data']['expiry'];
      this.stockOptionsStrikePrice = data['data']['strike_price']
    })
  }

  getHistoricData (option) {
    if(!document.getElementById('stock-price-history')) {
      console.log("skipping historic data fetch..")
      return
    }
    console.log("getting historic data : "+option.opt_symbol)

    this.stockService.getPriceHistory([option.opt_stock_id], 60).subscribe(resp => {
      let data = resp[option.opt_stock_id]
      let prices:any[] = []
      let volumes:any[] = []
      let mov_avg:any[] = []
      let bh:any[] = []
      let bl:any[] = []
      let maxVolume = 0;

      
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
        if(item.MA != 'null'){
          mov_avg.push(
            [
              Date.parse(item.stock_price_date),
              item.MA
            ]
          )

          bh.push(
            [
              Date.parse(item.stock_price_date),
              item.BH
            ]
          )

          bl.push(
            [
              Date.parse(item.stock_price_date),
              item.BL
            ]
          )
        }
        if(maxVolume < item.stock_price_volume)
          maxVolume = item.stock_price_volume
      });

      let priceVolume = [{
          'name': 'Price',
          'data': prices
          
        },
        {
          'name': 'MA',
          'data': mov_avg
          
        },
        {
          'name': 'BH',
          'data': bh
          
        },
        {
          'name': 'BL',
          'data': bl
          
        },
        {
          'name': 'Volume',
          'data': volumes,
          'type': 'area',
          'yAxis': 1,
          // 'pointWidth': Math.max(1, 240.0/volumes.length)
        }
      ]
      
      this.drawPriceHistory(priceVolume, maxVolume, this.getStockFromId(option.opt_stock_id).stock_name, "stock-price-history");
    },
    error =>{
      console.log(error)
    });


    this.stockService.getOptionHistory(option.opt_id).subscribe(data => {
      let prices:any[] = []
      let pricesLow:any[] = []
      let pricesHigh:any[] = []
      let volumes:any[] = []
      let maxVolume = 0;
      data['data'].forEach(item => {
        prices.push(
          [
            new Date().setTime(Date.parse(item.opt_ph_date)),
            item.opt_ph_close
          ]
        )
        pricesHigh.push(
          [
            new Date().setTime(Date.parse(item.opt_ph_date)),
            item.opt_ph_high
          ]
        )
        pricesLow.push(
          [
            new Date().setTime(Date.parse(item.opt_ph_date)),
            item.opt_ph_low
          ]
        )
        volumes.push(
          [
            new Date().setTime(Date.parse(item.opt_ph_date)),
            item.opt_ph_volume
          ]
        )
        maxVolume = Math.max(item.opt_ph_volume, maxVolume)
      })
      let priceVolume = [{
          'name': 'Price',
          'data': prices
          
        },
        {
          'name': 'Price High',
          'data': pricesHigh,
          'visible': false
          
        },
        {
          'name': 'Price Low',
          'data': pricesLow,
          'visible': false
          
        }
        ,{
          'name': 'Volume',
          'data': volumes,
          'type': 'area',
          'yAxis': 1,
        }]
      
      if(document.getElementById('option-historic-data'))
        this.drawPriceHistory(priceVolume, maxVolume, `${option.opt_symbol} ${option.opt_type} ${option.opt_strike_price} ${option.opt_expiry_date}`, "option-historic-data");
    })
  }
  setExpiry(expiry) {
    this.expiryDate = expiry
  }


  filterInv(invs: any[], status='HOLD') {
    let filtered = invs.filter(inv => inv.status === status)
    if (status === 'SOLD') {
      filtered.sort((a, b) => {
        if (a.sell_date < b.sell_date)
          return 1
        else if (a.sell_date > b.sell_date)
          return -1
        return b.id - a.id
      })
    }
    return filtered
  }

  setInvestmentSellDate(event){
    let setDate: Date = event.value
    this.invToSell.sell_date = (setDate.getMonth()+1)+'/'+setDate.getDate()+'/'+setDate.getFullYear();
  }

  setInvestmentDate(event){
    let setDate: Date = event.value
    this.newInvestment.inv_date = (setDate.getMonth()+1)+'/'+setDate.getDate()+'/'+setDate.getFullYear();
  }
  setStrikePrice(price) {
    this.strikePrice = price
  }

  // fetchAllLive() {
  //   if(this.liveAllTO !== undefined)
  //     clearInterval(this.liveAllTO)
  //   this.liveAllTO = setInterval(() => {
  //     let optids = []
  //     for(let i=0;i<this.activeOptions.length;i++)
  //       optids.push(this.activeOptions[i]['opt_id'])
  //     console.log(optids.join(','))
  //     this.stockService.fetchAllLive(optids.join(',')).subscribe(data => {
  //       console.log("fetched all...")
  //     })
  //   }, 5000)
  // }

  deleteOption(option: any) {
    this.stockService.deleteOption(option['opt_id']).subscribe(data => {
      console.log("option deleted.")
      this.getAllOptions()
    },
    (error) => this.toastr.error(`Cannot delete ${option.opt_symbol}`)
   )
  }

  getOptionChartData(data: any[]) {
    let timedelta = 6*60*60*1000 - 30*60*1000
    let prices:any[] = []
    let pricesLow:any[] = []
    let pricesHigh:any[] = []
    let diff: any[] = []
    let volumes:any[] = []
    let maxVolume = 0;
    let prev_vol=0

          // stockPV[0]['data'].forEach(item => {
          //   diff.push(
          //     [
          //       item[0],
          //       this.currentActiveOption.opt_type == 'CE' ? item[1]-this.currentActiveOption.opt_strike_price: this.currentActiveOption.opt_strike_price - item[1]
          //     ]
          //   )
          // })

    data.forEach(item => {
      if (item === undefined)
        return
      prices.push(
        [
          new Date().setTime(Date.parse(item.opt_ph_date_time) + timedelta),
          item.opt_ph_last
        ]
      )
      pricesLow.push(
        [
          new Date().setTime(Date.parse(item.opt_ph_date_time) + timedelta),
          item.opt_ph_low
        ]
      )
      pricesHigh.push(
        [
          new Date().setTime(Date.parse(item.opt_ph_date_time) + timedelta),
          item.opt_ph_high
        ]
      )
      volumes.push(
        [
          new Date().setTime(Date.parse(item.opt_ph_date_time) + timedelta),
          item.opt_ph_volume - prev_vol
        ]
      )
      maxVolume = Math.max(item.opt_ph_volume, maxVolume)
      prev_vol = item.opt_ph_volume
    })
    let priceVolume = [{
        'name': 'Price',
        'data': prices
        
      },
      {
        'name': 'Price High',
        'data': pricesHigh,
        'visible': false
        
      },
      {
        'name': 'Price Low',
        'data': pricesLow,
        'visible': false
        
      },
      {
        'name': 'Volume',
        'data': volumes,
        'type': 'area',
        'yAxis': 1,
      },
      // {
      //   'name': 'PD',
      //   'data': diff,
      //   'visible': false

      // }
    ]
    return {
      'optPriceVolume': priceVolume,
      'optMaxVolume': maxVolume
    }
  }

  getLive(option){
    this.updateCurrentLive(option.opt_id)
  }

  async updateCurrentLive(optId, optData:any[]=[], stockData:any[]=[]) {

    let option = this.activeOptions.filter(option => option.opt_id === optId)[0]
    let stock = this.getStockFromId(option.opt_stock_id)

    if (optData.length === 0){
      let resp = await this.stockService.fetchLive([optId]).toPromise()
      optData = resp['data'][optId]
  
    }
    if (stockData.length === 0){
      let stkResp =  await this.stockService.getPriceHistoryFromDB([stock.stock_id], 1, 1).toPromise()
      // console.log(stkResp)
      stockData = stkResp[stock.stock_id]
      // console.table(stockData['price_history'])
    }

    
    let {priceVolume, maxVolume} = this.getStockChartData(stockData)
    // console.table(priceVolume[0]['data'])
    if(document.getElementById("stock-live-data")) {
      // console.log(this.currentActiveOption.opt_stock_id, stock.stock_id)
      let priceVolumeWOMACD = priceVolume.filter(item => item.name.indexOf('MACD') === -1)
      let priceVolumeWMACD = priceVolume.filter(item => item.name.indexOf('MACD') !== -1 || item.name === 'Volume')
      this.drawPriceHistory(priceVolumeWOMACD, maxVolume, stock.stock_name + " (Live)", "stock-live-data");
      this.drawPriceHistory(priceVolumeWMACD, maxVolume, stock.stock_name + " (Live MACD)", "stock-live-data-macd");

    }
    
    let {optPriceVolume, optMaxVolume} = this.getOptionChartData(optData)
    
    let op_latest_price = optPriceVolume[0]['data'].slice(-1)[0][1]
    let stk_latest_price = priceVolume[0]['data'].slice(-1)[0][1]
    let stk_ma_price_tbp = priceVolume[1]['data'].slice(-1)[0][1] //ma price
    let stk_bl_price_tbp = priceVolume[2]['data'].slice(-1)[0][1] //bl price
    let stk_bh_price_tbp = priceVolume[3]['data'].slice(-1)[0][1] //bl price

    let opt_ma_price_p = stk_ma_price_tbp*(op_latest_price/stk_latest_price)
    let opt_bl_price_p = stk_bl_price_tbp*(op_latest_price/stk_latest_price)
    let opt_bh_price_p = stk_bh_price_tbp*(op_latest_price/stk_latest_price)

    //add to opt data
    let pMAData= {
      'name': 'Proj Price (MA)',
      'data': optPriceVolume[0]['data'].map(item => [item[0], opt_ma_price_p]),
      'color': colorMA
    }

    let pBLData= {
      'name': 'Proj Price (BL)',
      'data': optPriceVolume[0]['data'].map(item => [item[0], opt_bl_price_p]),
      'color': colorBL
    }

    let pBHData= {
      'name': 'Proj Price (BH)',
      'data': optPriceVolume[0]['data'].map(item => [item[0], opt_bh_price_p]),
      'color': colorBH
    }

    optPriceVolume.push(pMAData)
    optPriceVolume.push(pBLData)
    optPriceVolume.push(pBHData)

    if(document.getElementById("option-live-data")) {
      this.drawPriceHistory(optPriceVolume, optMaxVolume, `LIVE ${this.currentActiveOption.opt_symbol} ${this.currentActiveOption.opt_type} ${this.currentActiveOption.opt_strike_price} ${this.currentActiveOption.opt_expiry_date}`, "option-live-data");
    }
    // console.table(data['data'])
    option.opt_last_price_live = optData.slice(-1)[0].opt_ph_last
    stock.stock_current_price_live = stockData['price_history'].slice(-1)[0].stock_price_close

    this.updateOptionAlert()
  }

  openAddNewPFDialog() {
    const dialogRef = this.dialog.open(DialogNewPF, {
      data: { portfolioName: "" }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.getLatestPFs()
    });
  }

  getLen(arr: any[]) {
    return arr.length;
  }

  changePortfolio(portfolioId) {
    if (!isNaN(portfolioId)) {
      // this.liveTrack = false;
      this.resetStats()
      this.activePortId = parseInt(portfolioId);
      this.getAllInvs();
    }
  }

  fetchLive() {
    console.log("fetch live...")
    if(this.liveTO !== null || this.liveTO !== undefined)  {
      clearInterval(this.liveTO)
      this.liveTO = undefined
    }

    const getLive = async (enableAlert=true) => {
      console.log("getLive all options")
      let date = new Date()
      // can have stock for multiple types and strike prices; marking to avoid reload for the same stock

      let unExpiredOptions= this.activeOptions.filter(option => !this.isExpired(option))
      // // bring inv options at front
      // let invOptIds = this.optionsInvs.map(inv => inv.opt_id)
      // let invOpts = unExpiredOptions.filter(item => invOptIds.indexOf(item.opt_id) >= 0)

      let optIds = unExpiredOptions.map(option => option.opt_id)
      let stockIds:any[] = []
      // let stockIds = unExpiredOptions.map(option => option.opt_stock_id)
      // let stkData = {}
      // let optData = {}
      for(let option of unExpiredOptions) {
        let stock = this.getStockFromId(option.opt_stock_id)
        if(stockIds.indexOf(option.opt_stock_id) === -1) {
          stockIds.push(option.opt_stock_id)
          // this.stockService.getPriceHistoryFromDB([option.opt_stock_id], 1).subscribe(stkResp => {
          //   console.log(stkResp)
          //   stkData[option.opt_stock_id] = stkResp[option.opt_stock_id]
          //   stock.stock_current_price_live = stkData[option.opt_stock_id]['price_history'].slice(-1)[0].stock_price_close
          // });
        }

        // this.stockService.fetchLive([option.opt_id]).subscribe(optResp => {
        //   // console.table(optResp['data'][option.opt_id])
        //   optData[option.opt_id] = optResp['data'][option.opt_id]
        //   option.opt_last_price_live = optData[option.opt_id].slice(-1)[0].opt_ph_last
        //   if(option.opt_id === this.currentActiveOption.opt_id) {
        //     this.updateCurrentLive(option.opt_id, optData[option.opt_id], stkData[this.currentActiveOption.opt_stock_id])
        //   }
          
        // })

      }

      // setTimeout(()=> {
      //   this.updateOptionAlert()
      //   this.updateStats(enableAlert)
      // }, 10000)

      // this.stockService.fetchLive(optIds).subscribe(resp => {
      //   let data = resp['data']
      //   optIds.forEach(optId => {
      //     optData[optId] = data[optId]
      //   })
      // })

      // get all stock data in single request
      const [stkData, optResp] =  await Promise.all([
        this.stockService.getPriceHistoryFromDB(stockIds, 1).toPromise(),
        this.stockService.fetchLive(optIds).toPromise()
      ])

      stockIds.forEach(stockId => {
        if(Object.keys(stkData).indexOf(stockId) >= 0) {
          let stock = this.getStockFromId(stockId)
          stock.stock_current_price_live = stkData[stockId]['price_history'].slice(-1)[0].stock_price_close
          // console.log("updating stock : "+stockId)
        }
      })
      // stockIds.forEach(stockId => {
      //   this.prevPrices[stockId] = stkData[stockId]['price_history'].map(item => item.stock_price_close)
      // })

      let optData = optResp['data']
      // console.log(optData)
      optIds.forEach(optId => {
        let option = this.getOptionFromId(optId)
        // console.log("checking : "+optId+" : "+typeof(optId))
        try {
          if(optData[optId].length > 0) {
            option.opt_last_price_live = optData[option.opt_id].slice(-1)[0].opt_ph_last
            if(optId === this.currentActiveOption.opt_id) {
              this.updateCurrentLive(optId, optData[optId], stkData[this.currentActiveOption.opt_stock_id])
            }
            // console.log("updating option : "+option.opt_id)
          }
        }
        catch (err){
          console.error(err)
        }
        // if (optData[optId].slice(-1).length > 0) {
        //   this.updateActiveOptions(optId, optData[optId].slice(-1)[0].opt_ph_last)
        // }
      })

      this.updateOptionAlert()
      this.updateStats(enableAlert)


      
      if (!this.isMarketHours()) {
        clearInterval(this.liveTO)
        console.log("clear getLive interval")
        this.liveTO = undefined
        return
      }
  
    }
    getLive(true)
    if(this.isMarketHours())
      this.liveTO = setInterval(getLive, 12*1000)
  }

  getOptUniqueId(option) {
    return option.opt_symbol + option.opt_expiry_date + option.opt_strike_price + option.opt_type
  }

  isActiveOption(option) {
    this.activeOptions.map(item => this.getOptUniqueId(item)).indexOf(this.getOptUniqueId(option)) >= 0
  }

  isActiveInvest(option){
    return this.optionsInvs.map(item => item.opt_id).indexOf(option.opt_id) >= 0
  }

  getMedian(numbers:number[]) {
    if (!numbers.length) {
      return 0;
    }
  
    const sortedNumbers = [...numbers].sort((a, b) => a - b);
    const middleIndex = Math.floor(sortedNumbers.length / 2);
  
    if (sortedNumbers.length % 2 === 0) {
      const value1 = sortedNumbers[middleIndex - 1];
      const value2 = sortedNumbers[middleIndex];
      return (value1 + value2) / 2;
    } else {
      return sortedNumbers[middleIndex];
    }
  }

  getMean(numbers:number[]) {
    if (!numbers.length) {
      return 0;
    }
  
    const sortedNumbers = [...numbers].sort((a, b) => a - b);
    const middleIndex = Math.floor(sortedNumbers.length / 2);
  
    if (sortedNumbers.length % 2 === 0) {
      const value1 = sortedNumbers[middleIndex - 1];
      const value2 = sortedNumbers[middleIndex];
      return (value1 + value2) / 2;
    } else {
      return sortedNumbers[middleIndex];
    }
  }

  isMovingUp(priceList: any[], cp) {
    let sample = priceList.slice(-1*Math.min(priceList.length-1, 25))
    let upc = 0
    for(let c in sample){
      if(c > cp)
        upc += 1;
    }
    return upc > sample.length/2
  }
  
  isMarketHours() {
    const now = new Date();

    if(now.getDay() == 6 || now.getDay() == 7)
      return false
    
    // Define start time (9:15 AM)
    const startTime = new Date();
    startTime.setHours(9, 13, 0, 0);
    
    // Define end time (3:30 PM)
    const endTime = new Date();
    endTime.setHours(15, 32, 0, 0);
    
    return now >= startTime && now <= endTime;
  }

  updateOptionAlert() {
    const diffPerc = 0.005
    let isWW = (option) => { //is worth watching
      let stock = this.getStockFromId(option.opt_stock_id)
      let prevPrices = []
      if(Object.keys(this.prevPrices).indexOf(stock.stock_id) !== -1)
        prevPrices = this.prevPrices[stock.stock_id].slice(-1*Math.min(this.prevPrices[stock.stock_id].length, 30))
      // let direction = this.getMedian(prevPrices) >= stock.stock_current_price? "DOWN": "UP"
      let direction = this.isMovingUp(prevPrices, stock.stock_current_price)? "UP": "DOWN"
      // this.prevPrices[stock.stock_id] = stock.stock_current_price
      if (option.opt_type === "PE"){
        if(direction == "DOWN" && ((stock.stock_current_price - option.opt_strike_price) <= (2*diffPerc*stock.stock_current_price)))
          return true
      }
      if (option.opt_type === "CE"){
        if(direction == "UP" && ((option.opt_strike_price - stock.stock_current_price) <=  (2*diffPerc*stock.stock_current_price)))
          return true
      } 
      return false;
    }

    let isBad = (option) => {
      let stock = this.getStockFromId(option.opt_stock_id)
      let prevPrices = []
      if(Object.keys(this.prevPrices).indexOf(stock.stock_id) !== -1)
        prevPrices = this.prevPrices[stock.stock_id].slice(-1*Math.min(this.prevPrices[stock.stock_id].length, 30))
      // let direction = this.getMedian(prevPrices) >= stock.stock_current_price? "DOWN": "UP"
      let direction = this.isMovingUp(prevPrices, stock.stock_current_price)? "UP": "DOWN"
      // this.prevPrices[stock.stock_id] = stock.stock_current_price
      if (option.opt_type === "PE"){
        if(direction == "UP" && ((stock.stock_current_price - option.opt_strike_price) >= (diffPerc*stock.stock_current_price)))
          return true
      }
      if (option.opt_type === "CE"){
        if(direction == "DOWN" && ((option.opt_strike_price - stock.stock_current_price) >=  (diffPerc*stock.stock_current_price)))
          return true
      } 
      return false;
    }
  
    let isGood = (option)=> {
      let stock = this.getStockFromId(option.opt_stock_id)
      let prevPrices = []
      if(Object.keys(this.prevPrices).indexOf(stock.stock_id) !== -1)
        prevPrices = this.prevPrices[stock.stock_id].slice(-1*Math.min(this.prevPrices[stock.stock_id].length, 30))
      // let direction = this.getMedian(prevPrices) >= stock.stock_current_price? "DOWN": "UP"
      let direction = this.isMovingUp(prevPrices, stock.stock_current_price)? "UP": "DOWN"
      if (option.opt_type === "PE"){
        if(direction == "DOWN" && ((option.opt_strike_price-stock.stock_current_price) >=  (diffPerc*stock.stock_current_price)))
          return true
      }
      if (option.opt_type === "CE"){
        if(direction == "UP" && ((stock.stock_current_price - option.opt_strike_price) >=  (diffPerc*stock.stock_current_price)))
          return true
      } 
      return false;
    }

    this.activeOptions.forEach(option => {
      this.optionAlert[option.opt_id] = isGood(option)?"GOOD":isBad(option)?"BAD":isWW(option)?"WATCH":"NEUTRAL"
    })
    // console.log(this.optionAlert)
    // console.log(this.prevPrices)
  }
  updateCharts(tabChangeEvent: MatTabChangeEvent) {
    if(tabChangeEvent.index === 0)
     this.getLive(this.currentActiveOption)
    else
      this.getHistoricData(this.currentActiveOption)
  }

  getOP

  updateActiveOptions(opt_id, last_price) {
    for(let i=0;i<this.activeOptions.length;i++) {
      let option = this.activeOptions[i]
      if (option.opt_id === opt_id) {
        option.opt_last_price = last_price
        return
      }
    }
  }

  

  async getAllOptions(enableAlert=false) {
    let data = await this.stockService.fetchAllOptions().toPromise()
    this.activeOptions = data['data']
    this.filterActiveOptions(this.activeOptions, this.aoFilterValue)
    // console.table(this.activeOptions)
    if(this.currentActiveOption === undefined) {
      this.currentActiveOption = this.activeOptions[0]
      this.getHistoricData(this.currentActiveOption)
    }
    this.getAllInvs(enableAlert);
    this.fetchLive();

    this.activeStocks = []
    this.activeOptions.forEach(ao => {
      this.activeStocks.push(this.getStockFromId(ao.opt_stock_id))
      ao.opt_last_price_live = ao.opt_last_price
    })

  }
  checkITM(opt_id) {
    let option = this.getOptionFromId(opt_id)
    let stock = this.getStockFromId(option.opt_stock_id)
    if (option.opt_type === 'CE')
      return option.opt_strike_price <= stock.stock_current_price_live
    else
      return option.opt_strike_price >= stock.stock_current_price_live
  }

  getStockChartData(data) {
    console.log(data)
    let prices:any[] = []
    let volumes:any[] = []
    let ma:any[] = []
    let bl:any[] = []
    let bh:any[] = []
    let st:any[] = []
    let macdHist: any[] = []
    let macdSignal: any[] = []
    let macd: any[] = []
    let maxVolume = 0;
    // let delta = parseInt(data['delta'])
    // console.table(data['price_history'])
    let timedelta = 6*60*60*1000 - 30*60*1000
    // let timedelta = 0

    let prev_vol = 0
    
    data['price_history'].forEach(item => {
      prices.push(
        [
          // new Date().setTime(Date.parse(item.stock_price_date) + timedelta),
          Date.parse(item.stock_price_date) + timedelta,
          item.stock_price_close
        ]
      )
      volumes.push(
        [
          // new Date().setTime(Date.parse(item.stock_price_date) + timedelta),
          Date.parse(item.stock_price_date) + timedelta,
          Math.max(0, item.stock_price_volume - prev_vol)
        ]
      )

      ma.push(
        [
          // new Date().setTime(Date.parse(item.stock_price_date) + timedelta),
          Date.parse(item.stock_price_date) + timedelta,
          item.MA
        ]
      )

      bl.push(
        [
          // new Date().setTime(Date.parse(item.stock_price_date) + timedelta),
          Date.parse(item.stock_price_date) + timedelta,
          item.BL
        ]
      )

      bh.push(
        [
          // new Date().setTime(Date.parse(item.stock_price_date) + timedelta),
          Date.parse(item.stock_price_date) + timedelta,
          item.BH
        ]
      )

      st.push(
        [
          // new Date().setTime(Date.parse(item.stock_price_date) + timedelta),
          Date.parse(item.stock_price_date) + timedelta,
          this.currentActiveOption.opt_strike_price
        ]
      )

      macdHist.push(
        [
          // new Date().setTime(Date.parse(item.stock_price_date) + timedelta),
          Date.parse(item.stock_price_date) + timedelta,
          item.macd_hist
        ]
      )
      macdSignal.push(
        [
          // new Date().setTime(Date.parse(item.stock_price_date) + timedelta),
          Date.parse(item.stock_price_date) + timedelta,
          item.macd_signal
        ]
      )
      macd.push(
        [
          // new Date().setTime(Date.parse(item.stock_price_date) + timedelta),
          Date.parse(item.stock_price_date) + timedelta,
          item.macd
        ]
      )

      if(maxVolume < item.stock_price_volume)
        maxVolume = item.stock_price_volume
      prev_vol = item.stock_price_volume
      // timedelta += (delta*60*1000)
    });

    let priceVolume = [{
        'name': 'Price',
        'data': prices
        
      },
      {
        'name': 'MA',
        'data': ma,
        'color': colorMA
        
      },{
        'name': 'BL',
        'data': bl,
        'color': colorBL
        
      },{
        'name': 'BH',
        'data': bh,
        'color': colorBH
        
      },
      {
        'name': 'MACD Hist',
        'data': macdHist,
        'type': 'column',
        'color': colorMacdHist
      },
      {
        'name': 'MACD Signal',
        'data': macdSignal,
        'type': 'line',
        'color': colorMacdSignal
      },
      {
        'name': 'MACD',
        'data': macd,
        'type': 'line',
        'color': colorMacd,
      },
      {
        'name': 'Strike',
        'data': st,
        'style': 'dotted',
        'color': colorST
      }
      ,{
        'name': 'Volume',
        'data': volumes,
        'type': 'area',
        'yAxis': 1,
        // 'visible': false
        // 'pointWidth': Math.max(1, 240.0/volumes.length)
      }
    ]
    return {
      priceVolume,
      maxVolume
    }
  }


  getAllInvs(enableAlert=false) {
    console.log(`getting invs for ${this.activePortId}`)
    this.stockService.getAllOptionsInvestments(this.activePortId).subscribe(data => {
      this.optionsInvs = data['data']
      // console.table(this.optionsInvs)
      // console.log(this.getOptionFromId(this.optionsInvs[0].opt_id))
      this.updateStats(enableAlert)
      this.drawHoldingsPieChart();
    })
  }

  getOptionFromId(opt_id){
    return this.activeOptions.filter(opt => opt.opt_id === opt_id)[0]
  }

  addInvestment() {
    this.stockService.addOptionInvestment(this.currentActiveOption.opt_id, this.newInvestment.inv_date, this.newInvestment.inv_total_cost, this.activePortId).subscribe(data => {
      this.toastr.success('new investment added!')
      this.getAllInvs()
    })
  }

  addToActive(option) {
    this.stockService.addOption({
      stockId: option.opt_stock_id, expiryDate: option.opt_expiry_date, strikePrice: option.opt_strike_price,
      optionType: option.opt_type
    }).subscribe(async (resp) => {
      console.log(resp)
      await this.getAllOptions(false)
      this.toastr.success("option added to active list...")
      // console.log(this.activeOptions[0].opt_id)
      // console.log(resp['data']['opt_id'])
      this.currentActiveOption = this.activeOptions.filter(opt => Number.parseInt(opt.opt_id) === Number.parseInt(resp['data']['opt_id']))[0]
      // console.log(this.currentActiveOption)
    },
    error => {
      this.toastr.error(error)
    })
  }

  getProfit(inv) {
    return this.getOptionFromId(inv['opt_id'])['opt_last_price_live'] * inv.total_qty - inv.total_cost_price
  }
  getProfitPerc(inv) {
    return this.getProfit(inv)* 100 / inv.total_cost_price
  }

  addOption() {
    console.info({
      stockId: this.currentStock.stock_id, expiryDate: this.expiryDate, strikePrice: this.strikePrice,
      optionType: this.optionType
    })
    this.stockService.addOption({
      stockId: this.currentStock.stock_id, expiryDate: this.expiryDate, strikePrice: this.strikePrice,
      optionType: this.optionType
    }).subscribe(resp => {
      // console.log(resp)
      this.toastr.success("option added to active list...")
      this.getAllOptions()
      this.currentActiveOption = this.activeOptions.filter(opt => Number.parseInt(opt.opt_id) === Number.parseInt(resp['data']['opt_id']))[0]
      
    },
    error => {
      this.toastr.error(error)
    })
  }

  drawPieCharts(tabChangeEvent: MatTabChangeEvent) {
    if(tabChangeEvent.index === 0){
      this.drawHoldingsPieChart()
    }
    if(tabChangeEvent.index === 2){
      let categoryData:any = {}
      let stockData:any = {}
      let sellInvs = this.filterInv(this.optionsInvs, 'SOLD')
      let totalProfit = 0
      sellInvs.forEach(item => {
        if(item.total_sell_price <= item.total_cost_price)
          return
        let option = this.getOptionFromId(item.opt_id)
        let stock = this.getStockFromId(option.opt_stock_id)
        let profit = item.total_sell_price - item.total_cost_price
        if(Object.keys(stockData).indexOf(stock.stock_name) == -1)
          stockData[stock.stock_name] = 0
        if(Object.keys(categoryData).indexOf(stock.stock_category) == -1)
          categoryData[stock.stock_category] = 0

        stockData[stock.stock_name] += profit
        categoryData[stock.stock_category] += profit
        totalProfit += profit;
      })

      // Object.keys(stockData).forEach(item => {
      //   stockData[item] = Math.round(stockData[item]*100/totalProfit)
      // })

      // Object.keys(categoryData).forEach(item => {
      //   categoryData[item] = Math.round(categoryData[item]*100/totalProfit)
      // })

      this.drawPieChart(stockData, "sell_history_stock_pie", "Stock-wise Profit")
      this.drawPieChart(categoryData, "sell_history_category_pie", "Category-wise Profit")
      this.drawPL();
    }
  }

  trimChars(s: string, maxChars:number) {
    if(s.length < maxChars)
      return s
    return s.substring(0, maxChars).trim() + '..'
  }


  drawPieChart(pieData, container="sell_history_category_pie", title="Category-wise Profit") {
    this.getStockFromId
    let data:any[] = []
    Object.keys(pieData).forEach(key => {
      data.push({
        'name': key,
        'y': pieData[key]
      })
    })
    console.table(data)

    Highcharts.chart(container, {
      chart: {
          type: 'pie',
          height: 300
      },
      title: {
          text: title
      },
      tooltip: {
          valuePrefix: 'Rs.'
      },
      plotOptions: {
        series: {
          allowPointSelect: true,
          cursor: 'pointer',
        }
      },
      series: [
          {
              name: 'Ratio',
              colorByPoint: true,
              data: data
          }
      ]
  } as Highcharts.Options);
  }
  

  drawPriceHistory(priceVolume, maxVolume, stockName, div) {
      let chartOptions = {
        chart: {
          type: 'line',
          height: '350px',
          zoomType: 'x'
        },
        title: {
          text: 'Price Trend - '+stockName
        },
  
        xAxis: {
          'type': 'datetime',
          title: {
            text: 'Date'
          },
          zoomEnabled: true
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
        },
        ],
  
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
