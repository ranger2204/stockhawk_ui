import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { PortfolioService } from './services/portfolio.service';
import { StockService } from './services/stock.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit{
  title = 'eyestock';

  stockCount = 0;
  portfolioCount = 0;

  constructor(
    private stockService: StockService,
    private portfolioService: PortfolioService
  ){
  }

  ngOnInit(){
    this.stockService.getAllStocksDetails().subscribe(data => {
      this.stockCount = data['stocks'].length
    })

    this.portfolioService.getAllPortfolios().subscribe(data => {
      this.portfolioCount = data['portfolios'].length
    })
  }
}
