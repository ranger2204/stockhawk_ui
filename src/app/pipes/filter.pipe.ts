// filter.pipe.ts

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'appFilter' })
export class FilterPipe implements PipeTransform {
  /**
   * Transform
   *
   * @param {any[]} items
   * @param {string} searchText
   * @returns {any[]}
   */

  getStockFromId(stockId, allStocks){
    for(let i=0;i<allStocks.length;i++){
      let stock = allStocks[i]
      if(stock.stock_id == stockId)
        return stock
    }
  }

  transform(items: any[], searchText: string, allStocks, key: string=undefined): any[] {
    if (!items) {
      return [];
    }
    if (!searchText) {
      return items;
    }

    searchText = searchText.toLocaleLowerCase();
    return items.filter(it => {
      if(key == undefined)
        return it.toLocaleLowerCase().includes(searchText);
      else{
        let ks = Object.keys(it)
        for(let i=0; i<ks.length; i++){
          if(ks[i] == key)
            if(allStocks.length > 0)
              if(this.getStockFromId(it[ks[i]], allStocks).stock_name.toLocaleLowerCase().includes(searchText))
                return true;

          if(isNaN(it[ks[i]])){
            // console.log(it[ks[i]].toString())
            if(it[ks[i]].toString().toLocaleLowerCase().includes(searchText)){
              return true;
            }
          }
          
              
        }
        return false
      }
    });
  }
}
