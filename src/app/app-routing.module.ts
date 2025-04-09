import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AnalyticsComponent } from './components/analytics/analytics.component'
import { HoldingsComponent } from './components/holdings/holdings.component';
import { VirtualMarketComponent } from './components/virtual-market/virtual-market.component'
import { OptionsComponent } from './components/options/options.component'

const routes: Routes = [
  {path: '', component:AnalyticsComponent},
  {path: 'analytics', component:AnalyticsComponent},
  {path: 'virtualmarket', component:VirtualMarketComponent},
  {path: 'holdings', component:HoldingsComponent},
  {path: 'options', component:OptionsComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { 

  

}
