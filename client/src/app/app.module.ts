import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PlayImageComponent } from '@app/components/play-image/play-image.component';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { SquareInterfaceComponent } from '@app/components/square-interface/square-interface.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { ErrorDuringLoadingComponent } from './components/error-during-loading/error-during-loading.component';
import { GameCreationFormComponent } from './components/game-creation-form/game-creation-form.component';
import { ImageDifferencePopupComponent } from './components/image-difference-popup/image-difference-popup.component';
import { NameFormDialogComponent } from './components/name-form-dialog/name-form-dialog.component';
import { PopupDialogComponent } from './components/popup-dialog/popup-dialog.component';
import { UploadImageSquareComponent } from './components/upload-image-square/upload-image-square.component';
import { ConfigurationGameComponent } from './pages/configuration-game-page/configuration-game-page.component';
import { GameCreationPageComponent } from './pages/game-creation-page/game-creation-page.component';
import { GameSelectionPageComponent } from './pages/game-selection-page/game-selection-page.component';
import { SoloGamePageComponent } from './pages/solo-game-page/solo-game-page.component';

/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        AppComponent,
        MainPageComponent,
        GameSelectionPageComponent,
        SidebarComponent,
        UploadImageSquareComponent,
        GameCreationFormComponent,
        SquareInterfaceComponent,
        SoloGamePageComponent,
        PopupDialogComponent,
        ErrorDuringLoadingComponent,
        NameFormDialogComponent,
        PlayImageComponent,
        GameCreationPageComponent,
        ConfigurationGameComponent,
        ImageDifferencePopupComponent,
    ],
    imports: [
        AppMaterialModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        HttpClientModule,
        MatIconModule,
        MatToolbarModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
    ],
    providers: [],
    entryComponents: [PopupDialogComponent, NameFormDialogComponent],
    bootstrap: [AppComponent],
})
export class AppModule {}
