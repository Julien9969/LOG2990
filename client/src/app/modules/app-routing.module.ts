import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfigurationGameComponent } from '@app/pages/configuration-game-page/configuration-game-page.component';
import { GameCreationPageComponent } from '@app/pages/game-creation-page/game-creation-page.component';
import { GameSelectionPageComponent } from '@app/pages/game-selection-page/game-selection-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { SoloGamePageComponent } from '@app/pages/solo-game-page/solo-game-page.component';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'selection-view', component: GameSelectionPageComponent },
    { path: 'solo-game', component: SoloGamePageComponent },
    { path: 'game-creation', component: GameCreationPageComponent },
    { path: 'config', component: ConfigurationGameComponent },
    { path: '**', redirectTo: '/home' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
