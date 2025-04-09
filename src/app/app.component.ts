import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { PortfolioService } from './services/portfolio.service';
import { StockService } from './services/stock.service';
import { ToastrService} from 'ngx-toastr';
import { SlideInOutAnimation } from './components/analytics/animations';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
  animations: [SlideInOutAnimation]
})
export class AppComponent implements OnInit{
  title = 'eyestock';

  stockCount = 0;
  portfolioCount = 0;
  liveDataInterval = undefined;
  liveNews:any[] = [];
  liveAlerts = []
  animationState = 'close'
  baseURL:string|null = '';
  stockDetails:any[] = []

  indexDetails = []

  constructor(
    private stockService: StockService,
    private portfolioService: PortfolioService,
    private toastr: ToastrService
  ){
  }

  ngOnInit(){
    this.baseURL = localStorage.getItem("ESBaseURL")
    if(this.baseURL == undefined)
      this.baseURL = 'http://192.168.0.171:5001'


    this.stockService.getAllStocksDetails().subscribe(resp => {
      let stocks = resp['stocks']
      this.stockCount = stocks.length
      for(let i=0;i<stocks.length;i++){
        let stock = stocks[i]
        this.stockDetails[stock.stock_id] = stock
      }
    })
    
    this.portfolioService.getAllPortfolios().subscribe(data => {
      this.portfolioCount = data['portfolios'].length
    })
    

    this.getLiveData()

  }

  updateBaseURL(event){
    this.baseURL = event.target.value
    localStorage.setItem("ESBaseURL", this.baseURL)
    console.log(`baseURL : ${this.baseURL}`)
  }



  toggleLiveBar(){
    this.animationState = this.animationState === 'open' ? 'close' : 'open';
  }

  checkSubString(mainString, subStr){
    return mainString.indexOf(subStr) != -1
  }

 

  getLiveData(){
    let date = new Date()
    if(this.liveDataInterval !== undefined) {
      clearInterval(this.liveDataInterval)
      this.liveDataInterval = undefined
    }

    this.liveNews = []
    let checkMatch = (id_, type_='news') => {
      if(type_ == 'news'){
        let ids = this.liveNews.map(x => x.news_id)
        return ids.indexOf(id_) != -1
        // for(let i=0;i<this.liveNews.length;i++){
        //   let item = this.liveNews[i]
        //   if(item.news_id == id_)
        //     return true
        // }
        
        // return false
      }
      else{
        for(let i=0;i<this.liveAlerts.length;i++){
          let item = this.liveAlerts[i]
          if(item.al_hst_id == id_)
            return true
        }
        
        return false
      }
    }
    

    let updateLiveData = (forceUpdate=false) => {
      let lastId = -1

      if(this.liveNews.length > 0) {
        let allIds = this.liveNews.map(news => Number.parseInt(news.news_id))
        lastId = Math.max(...allIds)
      }

      this.stockService.getLiveNews(lastId).subscribe(resp => {
        let newNews: any[] = resp['data']['live-news']
        // let newNews = JSON.parse((JSON.stringify(latestNews)))
        // console.log(newNews)
        // let n = newNews.length
        newNews.reverse()
        for(let i=0;i<newNews.length;i++){
          let item = newNews[i]

          if(!forceUpdate) {
            // console.log(item)
            let msg_html = `
                ${item.news_heading}<br>
                ${item.news_datetime}
            `
            this.toastr.info(msg_html, '', {
              closeButton: true,
              disableTimeOut: 'extendedTimeOut',
              extendedTimeOut: 5000,
              positionClass: 'toast-bottom-right',
              enableHtml: true,
              progressBar: true
            })
          }
          this.liveNews.unshift(item)

        }
        
      })

    

      this.stockService.getAlertHistoryForDate().subscribe(resp => {
        let latestAlerts: Array<any> = resp['alerts'];
        console.log(latestAlerts)
        let back = JSON.parse((JSON.stringify(latestAlerts)))
        if(this.liveAlerts.length > 0){
          for(let i=0;i<latestAlerts.length;i++){
            let item = latestAlerts[i]
            if(checkMatch(item.al_hst_id, 'alerts') == false){

              console.log(item)
              let msg_html = `
                  ${this.stockDetails[item.al_hst_stock_id]['stock_name']} - ${item.al_hst_cur_value}<br>
                  ${item.al_hst_datetime}
              `
              this.toastr.warning(msg_html, '', {
                closeButton: true,
                disableTimeOut: 'extendedTimeOut',
                extendedTimeOut: 5000,
                positionClass: 'toast-bottom-left',
                enableHtml: true,
                progressBar: true
              })
            }
              
          }
        }
        this.liveAlerts = back
      })
      
      if (((date.getHours() <= 15 && date.getMinutes() <= 35 )&& (date.getHours() >= 9 && date.getMinutes() >= 10)) || forceUpdate === true)
        this.stockService.getAllLiveIndex().subscribe(data => {
          if(data['data']['live-index'].length > 0)
            console.log("updating indices...")
            this.indexDetails = data['data']['live-index']
            console.table(this.indexDetails)
        })
    }

    

    updateLiveData(true)
    this.liveDataInterval = setInterval(() => {
      updateLiveData(false)
    }, 1000*15)
  }

  toFloat(numstr: string) {
    return Number.parseFloat(numstr)
  }

  roundFloat(floatValue: Number) {
    if(floatValue == undefined)
      return "0"
    return Number(floatValue.toFixed(2)).toLocaleString();
  }
  

  roundFloatWithSign(floatValue: Number) {
    if(floatValue == undefined)
      return "0"
    let sign = "+"
    if (floatValue.valueOf() < 0) {
      sign = '-'
    }
    return sign+Math.abs(Number(floatValue.toFixed(2))).toLocaleString();
  }

  getLen(objList){
    return objList.length
  }
}
