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
  activePortfolio = undefined;
  portfolioDetails = undefined;
  investmentDetails = [];
  stockDetails = [];
  stockAutoCompleteList = [];
  stockAutoCompleteTO = undefined;
  displayedColumns = ['stock_name', 'quantity', 'perSharePriceCost', 'perSharePriceCurrent', 'cost', 'market_value', 'pL', 'change', '5yfd', 'action']
  stockPriceHistory = {}

  currentPFStockValue = []


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

  changePortfolio(portfolioId) {
    if (!isNaN(portfolioId)) {
      this.activePortfolio = parseInt(portfolioId);
      console.log(`Portfolio changed to ${this.activePortfolio}`);

      this.portfolioService.getPortfolioById(this.activePortfolio).subscribe(data => {
        console.log(data)
        this.portfolioDetails = data['portfolio']
        this.investmentDetails = data['investments']
        this.stockDetails = data['stocks']
        this.getPriceHistoryForPortfolio(this.activePortfolio)
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

  roundFloat(floatValue) {
    return Number((floatValue).toFixed(2));
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

  addInvestment() {
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


  getPriceHistoryForPortfolio(portfolioId) {
    this.portfolioService.getPriceHistoryForPortfolio(portfolioId).subscribe(data => {
      let priceHistory: any = data['price_history'];
      console.log(priceHistory)
      let stockIds = Object.keys(priceHistory)
      stockIds.forEach(stockId => {
        this.stockPriceHistory[stockId] = priceHistory[stockId]
      })
      this.currentPFStockValue = []
      let inColors = []
      this.investmentDetails.forEach((investment, index) => {
        let data_live = []
        let data_fixed = []
        this.stockPriceHistory[investment.inv_stock_id].forEach(ph => {
          data_live.push(
            [
              Date.parse(ph.stock_price_date),
              investment.inv_stock_qty * ph.stock_price_close,
              // investment.inv_stock_qty * investment.inv_stock_cost_per_share
            ]
          )
          data_fixed.push(
            [
              Date.parse(ph.stock_price_date),
              investment.inv_stock_qty * investment.inv_stock_cost_price
            ]
          )
          
        });

        let color = this.getRandomColors(inColors)
        inColors.push(color)
        this.currentPFStockValue.push({
          'name': this.stockDetails[index].stock_name,
          'data': data_live,
          'color': color,
          'selected': true
        })

        this.currentPFStockValue.push({
          'name': this.stockDetails[index].stock_name+'_INV',
          'showInLegend': false,  
          'data': data_fixed,
          'color': color,
          'dashStyle': 'dash',
          'linkedTo': ':previous',
        })

      });
      this.drawPortfolioTrend()

    })
  }

  calculateCI(startPrice, years=5, rate=10){
    return Math.round(startPrice*Math.pow((1+rate/100), years) - startPrice);
  }

  drawPortfolioTrend() {

    console.log(this.currentPFStockValue)
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