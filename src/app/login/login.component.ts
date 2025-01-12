import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/auth';

import { AngularFirestore } from '@angular/fire/firestore';

import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { RouterLink, Router } from '@angular/router';
import { MsgService } from 'src/services/msg.service';
import { AuthService } from 'src/services/auth.service';


@Component({
   selector: 'app-login',
   templateUrl: './login.component.html',
   styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

   formLogin: FormGroup
   route: string;
   constructor(private fb: FormBuilder, public auth: AngularFireAuth, private msg: MsgService, public authService: AuthService, private router: Router) { }

   ngOnInit(): void {
      //this.route="#";
      
      this.formLogin = this.fb.group({
         correo: ['', Validators.compose([Validators.required, Validators.email])],
         contraseña: ['', Validators.required]
      })
   }
   logIn() {
      this.auth.auth.signInWithEmailAndPassword(this.formLogin.value.correo, this.formLogin.value.contraseña).then((usuario) => {
         //this.route='/inicio';
         this.router.navigate(['/inicio']);
         this.msg.msgSuccess('Exito', 'Bienvenido de nuevo')

      }).catch((error) => {
         this.route="#";
         switch (error.code) {
            case 'auth/user-not-found': {
               this.msg.msgError('Error', 'No se ha encontrado el usuario');
               break;
            }
            case 'auth/invalid-email': {
               this.msg.msgError('Error', 'El correo es inválido');
               break;
            }
            case 'auth/wrong-password': {
               this.msg.msgError('Error', 'Contraseña incorrecta');
               break;
            }
            default: {
               this.msg.msgError('Error', 'Se encontró el error: ' + error.code + 'por favor contacta a soporte');
               break;
            }
         }

      })

   }
   logIn2() {
      this.authService.GoogleAuth().then((Usuario)=> {
         //this.route='/inicio';
         this.router.navigate(['/inicio']);
         this.msg.msgSuccess('Exito', 'Bienvenido de nuevo')

      }).catch((error) => {
         this.route="#";
         switch (error.code) {
            case 'auth/user-not-found': {
               this.msg.msgError('Error', 'No se ha encontrado el usuario');
               break;
            }
            case 'auth/invalid-email': {
               this.msg.msgError('Error', 'El correo es inválido');
               break;
            }
            case 'auth/wrong-password': {
               this.msg.msgError('Error', 'Contraseña incorrecta');
               break;
            }
            default: {
               this.msg.msgError('Error', 'Se encontró el error: ' + error.code + 'por favor contacta a soporte');
               break;
            }
         }

      })

         //this.route='/inicio';
         /*this.router.navigate(['/inicio']);
         this.msg.msgSuccess('Exito', 'Bienvenido de nuevo')*/
         

   }
}

