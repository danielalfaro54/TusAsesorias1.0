import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Curso } from 'src/models/curso';
import { AngularFirestore } from '@angular/fire/firestore';
import { Usuario } from 'src/models/usuario';
import { MsgService } from 'src/services/msg.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/auth';
import { Certificacion } from 'src/models/certificacion';
import { AngularFireStorage } from '@angular/fire/storage';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentRate = 5
  cursos: Array<Curso> = new Array();
  certificados: Array<Certificacion> = new Array()
  instructor = 'instructor'
  alumno = 'alumno'
  administrador = 'administrador'
  usuario: Usuario
  usuarios: Usuario
  isValid: boolean = false
  isCollapsed: boolean = false;
  confirmar: boolean = false;
  constructor(private ar: ActivatedRoute, public dialog: MatDialog, private msg: MsgService, private db: AngularFirestore, private auth: AngularFireAuth, private fb: FormBuilder) { }

  ngOnInit(): void {


    this.getUser()
    this.getUsers()
    this.getCourses()
    this.getCertificados();
    //this.getEstudiantes();
    console.log(this.cursos);
    //this.getUsers()
  }

  //Con este método se obtiene el número de estudiantes que ha tenido el instructor en el último mes
  getEstudiantes() {
    console.log("EEEEEEE");
    this.usuario.totalEstudiantes = 0;
    let today = new Date();
    today.setDate(today.getUTCDate() - 30);
    console.log("AAAAAAA")
    console.log(this.usuario.estudiantes);
    for (let estudiante in this.usuario.estudiantes) {
      let date = new Date();
      date.setTime(parseInt(estudiante));

      if (date.getTime() > today.getTime()) {
        this.usuario.totalEstudiantes = this.usuario.totalEstudiantes + parseInt(this.usuario.estudiantes[estudiante]);
      }
    }
  }
  // seccion de llamar informacion
  getUser() {
    this.db.collection('usuarios').doc(this.ar.snapshot.params.idMaestro).get().forEach((res) => {
      this.usuario = res.data() as Usuario
      console.log("USUARIO");
      console.log(this.usuario)
      console.log(this.usuario.mostrarinfo)
      this.getEstudiantes();
    })
  }

  getUsers() {
    this.db.collection('usuarios').get().subscribe((res) => {
      res.docs.forEach((item) => {
        let u = item.data() as Usuario
        if (u.uid == this.auth.auth.currentUser.uid) {
          this.usuarios = u;
          this.isValid = true
          console.log(this.isValid)
        } else {
          console.log("no existe");
        }
      })
    })
  }
  openDialog(): void {
    if (this.usuarios.tipoUsuario == this.alumno) {
      const dialogRef = this.dialog.open(reportProfile, {
        width: '500px',
        height: '250px',
        //Para en enviar informacion a un dialogo se usa la variable data (teniendo en cuenta que existe una llamada asi tambien en el dialogo)
        data: {
          maestro: this.usuario,
          alumno: this.auth.auth.currentUser.uid
        }
      });
    }
    if (this.usuarios.tipoUsuario == this.instructor) {
      const dialogRef2 = this.dialog.open(editProfile, {
        width: '500px',
        height: '500px',
        //Para en enviar informacion a un dialogo se usa la variable data (teniendo en cuenta que existe una llamada asi tambien en el dialogo)
        /*data: {
          maestro: this.ar.snapshot.params.idMaestro,
          alumno: this.auth.auth.currentUser.uid
        }*/
      });
    }

  }

  getCertificados() {
    this.db.collection('certificados').get().subscribe((res) => {
      res.docs.forEach((item) => {
        var certificado = item.data() as Certificacion
        console.log(certificado);
        if (certificado.user.uid == this.ar.snapshot.params.idMaestro && certificado.status == "aprobado") {
          certificado.id = item.id
          this.certificados.push(certificado);
        }
      })
    })
  }

  getCourses() {
    this.db.collection('cursos').get().subscribe((res) => {
      res.docs.forEach((item) => {
        var curso = item.data() as Curso
        if (curso.user.uid == this.ar.snapshot.params.idMaestro) {
          curso.id = item.id
          this.db.collection('evaluaciones').get().subscribe((res2) => {
            var e = new Array<any>();
            var E: any = 0
            res2.docs.forEach((item2) => {

              if (item2.id.split('@')[1] == curso.id) {
                e.push(item2.data().calificacion)
                E = E + item2.data().calificacion
              }
            })
            curso.evaluaciones = E / e.length;
            this.cursos.push(curso);

          })
        }
      })
    })
  }
  // secccion de dialogos

  openReport(): void {
    const dialogRef = this.dialog.open(reportProfile, {
      width: '500px',
      height: '250px',
      //Para en enviar informacion a un dialogo se usa la variable data (teniendo en cuenta que existe una llamada asi tambien en el dialogo)
      data: {
        maestro: this.usuario,
        alumno: this.auth.auth.currentUser.uid
      }
    });


  }
  openImages(imgs, id) {
    console.log(imgs);
    if (imgs == undefined) {
      imgs = new Array()

    }

    const dialogRef3 = this.dialog.open(addImages, {
      width: '500px',
      height: '500px',

      data: {
        imagenes: imgs,
        tipoUsuario: this.usuario.tipoUsuario
      }
    });
    dialogRef3.afterClosed().subscribe(res => {
      this.db.collection('cursos').doc(id).update({
        evidencia: res
      })
    })
  }

  openMaterial(id, gd, od, git) {
    const dialogRef4 = this.dialog.open(material, {
      width: '440px',
      height: '175px',
      data: {
        id: id,
        github: git,
        odrive: od,
        gdrive: gd,
        tipoUsuario: this.usuario.tipoUsuario
      }
    }

    )
  }

  //Sesion de operaciones
  validateCurso(c: Curso) {
    for (let certificado of this.certificados) {
      if (c.categoria.nombre == certificado.categoria.nombre) {
        return true;
      }
    }
    return false;
  }
  eliminarAsesoria(id) {
    //this.msg.msgAlerta('¿Seguro que quieres eliminar esta asesoria?','Se eliminara todo lo relacionado a esta asesoria',this.confirmar);

    Swal.fire({
      title: '¿Seguro que quieres eliminar esta asesoría?',
      text: 'Se eliminará todo lo relacionado a esta asesoría',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si'
    }).then((result) => {
      if (result.isConfirmed) {

        Swal.fire(
          'Asesoría eliminada',
          'success'
        )
        this.db.collection('cursos').doc(id).delete().finally(() => {

          window.location.reload()
        })
      }
    })




  }
}
@Component({
  selector: 'reportProfile',
  templateUrl: 'reportProfile.html',

})
export class reportProfile implements OnInit {
  formReporte: FormGroup;
  formReportes: FormGroup
  allreports: Array<any> = new Array();

  constructor(
    public dialogRef: MatDialogRef<reportProfile>,
    @Inject(MAT_DIALOG_DATA) public data: any, private db: AngularFirestore, private msg: MsgService, private router: Router, private fb: FormBuilder, private ar: ActivatedRoute, private auth: AngularFireAuth) { }
  ngOnInit(): void {

    this.exitsReport()
    this.formReporte = this.fb.group({
      maestro: [''],
      alumno: [''],
      reporte: ['', Validators.required],
      fecha: ['']

    })


  }


  saveReport() {

    console.log(this.data.maestro);

    this.formReporte.value.maestro = this.data.maestro
    this.formReporte.value.alumno = this.data.alumno
    this.formReporte.value.fecha = new Date()



    this.db.collection('reportes').add(this.formReporte.value).finally(() => {
      console.log('entra aqui');

      if (this.allreports.length >= 4) {

        var fechaInicio = new Date()
        var fechaFinal = new Date()
        fechaFinal.setDate(fechaFinal.getUTCDate() + 15)
        this.db.collection('baneados').doc(this.data.maestro.uid).set({
          fechaInicio: fechaInicio,
          fechaFinal: fechaFinal,
          tipoSuspension: 'Automatica',
          maestro: this.data.maestro
        })
      }
      this.msg.msgSuccess('Éxito', 'Reporte creado correctamente')

      this.dialogRef.close();
    }).catch((err) => {
      console.log(err)
      this.msg.msgError('Error', 'Algo salió mal')
    })

  }

  onNoClick(): void {
    this.dialogRef.close();
  }


  exitsReport() {
    var reports: Array<any> = new Array()
    this.db.collection('reportes').get().subscribe((res) => {


      res.docs.forEach((item) => {
        if (item.data().maestro.uid == this.data.maestro.uid) {
          this.allreports.push(item);

        }
        if (item.data().maestro.uid == this.data.maestro.uid && item.data().alumno == this.data.alumno) {
          reports.push(item.data())
          console.log('eee')
          console.log(reports.length);


          if (reports.length > 0) {
            this.msg.msgError('Reporte', 'Ya has reportado a este maestro')
            this.dialogRef.close();
            console.log('exite');

          } else {

          }
        }
      })

    })
    console.log(reports.length);

  }
}
@Component({
  selector: 'editProfile',
  templateUrl: 'editProfile.html',
  styleUrls: ['editProfile.css']

})
export class editProfile implements OnInit {
  formUsuario: FormGroup
  instructor = 'instructor'
  alumno = 'alumno'
  administrador = 'administrador'
  urlImg: string
  usuario: Usuario
  usuarios: Usuario
  idUsuario: string
  editCorreo: boolean = false
  editContra: boolean = false
  editImg: boolean = false
  editProfile: boolean = false
  editBiog: boolean = true
  editcelular: boolean = true
  mostrar: boolean = true
  isValid: boolean = false
  normal: 'normal'
  tipoCorreo: string
  constructor(private db: AngularFirestore, private fb: FormBuilder, private storage: AngularFireStorage, private msg: MsgService, private auth: AngularFireAuth, private activeRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.idUsuario = this.auth.auth.currentUser.uid
    this.getUser();
    this.getUsers();
    this.formUsuario = this.fb.group({
      correo: ['', Validators.email],
      contraseña: ['', Validators.minLength(8)],
      img: [''],
      bio: [''],
      cel: [''],
      mostrarinfo: ['']
    })

  }
  //Añade Imagen a Firestore
  addImg(event) {
    if (event.target.files.length > 0) {
      let name = new Date().getTime().toString()
      let file = event.target.files[0]
      let type = file.name.toString().substring(file.name.toString().lastIndexOf('.'))
      let imgpath = 'usuarios/' + name + type;
      const ref = this.storage.ref(imgpath);
      const task = ref.put(file)
      task.then((obj) => {
        ref.getDownloadURL().subscribe((url) => {
          this.usuario.img = url;
        })
      })
    }
  }
  //Actualiza el email tanto de Autenticacioon como de la base de datos
  editEmail() {
    var user = this.auth.auth.currentUser;

    user.updateEmail(this.formUsuario.value.correo).then(() => {
      this.db.collection('usuarios').doc(user.uid).update({
        correo: this.formUsuario.value.correo
      })
    }).then(() => {
      this.msg.msgSuccess('Correo', 'Correo editado Satisfactoriamente')
    }).catch((err) => {

      this.msg.msgError('Error', err)
    })
  }
  //Actualiza la contraseeña tanto de Autenticacioon como de la base de datos
  editPass() {
    var user = this.auth.auth.currentUser;

    user.updatePassword(this.formUsuario.value.contraseña).then(() => {
      this.db.collection('usuarios').doc(user.uid).update({
        contraseña: this.formUsuario.value.contraseña
      })
    }).then(() => {
      this.msg.msgSuccess('Contraseña', 'Contraseña cambiada Satisfactoriamente')
    }).catch((err) => {

      this.msg.msgError('Error', err)
    })
  }
  //Actualiza la imagen  de la base de datos
  editImgs() {
    var user = this.auth.auth.currentUser;

    this.db.collection('usuarios').doc(user.uid).update({
      img: this.usuario.img

    }).then(() => {
      this.msg.msgSuccess('Imagen', 'Imagen cambiada Satisfactoriamente')
    }).catch((err) => {

      this.msg.msgError('Error', err)
    })
  }
  //Actualiza Bio
  editBio() {
    var user = this.auth.auth.currentUser.uid
    this.db.collection('usuarios').doc(user).update({
      bio: this.formUsuario.value.bio
    }
    ).then(() => {
      this.msg.msgSuccess('Exito', 'Biografía actualizada correctamente')
    }).catch((err) => {
      console.log(err);


    })

  }
  editCel() {
    var user = this.auth.auth.currentUser.uid
    this.db.collection('usuarios').doc(user).update({
      cel: this.formUsuario.value.cel
    }
    ).then(() => {
      this.msg.msgSuccess('Exito', 'Teléfono actualizado correctamente')
    }).catch((err) => {
      console.log(err);


    })

  }
  editInfo() {
    var user = this.auth.auth.currentUser.uid
    this.db.collection('usuarios').doc(user).update({
      mostrarinfo: this.formUsuario.value.mostrarinfo
    }
    ).then(() => {
      this.msg.msgSuccess('Éxito', 'Se actualizó su preferencia')
    }).catch((err) => {
      console.log(err);

    })
  }
  //Se encarga de ver que cambio se van a realizar y llama a los metodos correspondientes
  editUser() {
    if (this.editImg) {
      this.editImgs()
    }
    if (this.editCorreo) {

      this.editEmail()
    }
    if (this.editContra) {

      this.editPass()
    }
    if (this.editBiog) {
      this.editBio()
    }
    if (this.editcelular) {
      this.editCel()
    }
    if (this.mostrar) {
      this.editInfo()
    }
  }

  //Obtiene el usuario
  getUser() {
    this.db.collection('usuarios').get().subscribe((res) => {
      res.docs.forEach((item) => {
        let u = item.data() as Usuario;
        if (u.uid == this.idUsuario) {
          u.uid = item.id;
          u.ref = item.ref;
          this.usuario = u;
          console.log(this.usuario.img)
          this.tipoCorreo = u.correo.split('@')[1]
          console.log(this.tipoCorreo);
          console.log("UUUUUUUUUUUUUUUUUUUUUUUUUUUU")
          console.log(this.usuario)
          console.log(this.usuario.count)
          this.formUsuario.get('bio').setValue(this.usuario.bio)
          this.formUsuario.get('cel').setValue(this.usuario.cel)
        }
      })
    })

  }
  /*getUser() {
    this.db.collection('usuarios').doc(this.ar.snapshot.params.idMaestro).get().forEach((res) => {
      this.usuario = res.data() as Usuario
      console.log(this.usuario)
    })
  }*/
  getUsers() {
    this.db.collection('usuarios').get().subscribe((res) => {
      res.docs.forEach((item) => {
        let u = item.data() as Usuario
        if (u.uid == this.auth.auth.currentUser.uid) {
          this.usuarios = u;
          this.isValid = true
          console.log(this.isValid)
        } else {
          console.log("no existe");
        }
      })
    })
  }

}
@Component({
  selector: 'addImages',
  templateUrl: 'addImages.html',

})
export class addImages implements OnInit {


  cantidad: number = 1
  tabs
  value
  constructor(
    public dialogRef: MatDialogRef<addImages>,
    @Inject(MAT_DIALOG_DATA) public data: any, private db: AngularFirestore, private storage: AngularFireStorage, private msg: MsgService, private router: Router, private ar: ActivatedRoute, private auth: AngularFireAuth) { }
  ngOnInit(): void {

    console.log(this.data.imagenes);

    this.getTabs()



  }
  getTabs() {
    if (this.data.imagenes == undefined || this.data.imagenes.length < 1) {
      this.tabs = ['Imagen 1']
    } else {
      var n = 1;
      this.tabs = new Array()
      this.data.imagenes.forEach(element => {
        this.tabs.push('Imagen ' + n)
        n++
      });
    }
  }
  addTabs() {
    var n = this.tabs.length + 1
    this.tabs.push('Imagen ' + n)
    console.log("new tab");

  }
  addImg(event, i) {
    if (event.target.files.length > 0) {
      let name = new Date().getTime().toString()
      let file = event.target.files[0]
      let type = file.name.toString().substring(file.name.toString().lastIndexOf('.'))
      let imgpath = 'evidencia/' + name + type;
      const ref = this.storage.ref(imgpath);
      const task = ref.put(file)
      task.then((obj) => {
        ref.getDownloadURL().subscribe((url) => {
          this.data.imagenes[i] = url
          console.log(this.data.imagenes[0]);

        })
      })
    }
  }
}
@Component({
  selector: 'material',
  templateUrl: 'material.html',

})
export class material implements OnInit {
  vista = 'opcion'
  txtGit = ' '
  formEnlaceGit: FormGroup
  formEnlaceOD: FormGroup
  formEnlaceGD: FormGroup
  isVisibleGit: boolean = true;
  isVisibleGD: boolean = true;
  isVisibleOD: boolean = true;
  constructor(
    public dialogRef: MatDialogRef<material>,
    @Inject(MAT_DIALOG_DATA) public data: any, private db: AngularFirestore, private storage: AngularFireStorage, private msg: MsgService, private fb: FormBuilder) { }
  ngOnInit(): void {
    this.formEnlaceGit = this.fb.group({
      enlace: ['']
    })
    this.formEnlaceOD = this.fb.group({
      enlace: ['']
    })
    this.formEnlaceGD = this.fb.group({
      enlace: ['']
    })

    if (this.data.github != undefined) {
      console.log("here");

      this.isVisibleGit = false;
      this.formEnlaceGit.get('enlace').setValue(this.data.github)
    }
    if (this.data.odrive != undefined) {
      this.isVisibleOD = false

      this.formEnlaceOD.get('enlace').setValue(this.data.odrive)
    }
    if (this.data.gdrive != undefined) {
      this.isVisibleGD = false
      this.formEnlaceGD.get('enlace').setValue(this.data.gdrive)
    }

  }
  guardarGit() {
    console.log(this.data);

    if (this.formEnlaceGit.value.enlace.startsWith('https://github.com/')) {
      this.db.collection('cursos').doc(this.data.id).update({
        github: this.formEnlaceGit.value.enlace
      }).finally(() => {
        this.msg.msgSuccess('Exito', 'Material actualizado correctamente')
      })

    } else {
      this.msg.msgWarning('Error', 'Enlace no valido')
    }

  }
  guardarOD() {

    if (this.formEnlaceOD.value.enlace.startsWith('https://onedrive.live.com/')) {
      this.db.collection('cursos').doc(this.data.id).update({
        odrive: this.formEnlaceGit.value.enlace
      }).finally(() => {
        this.msg.msgSuccess('Exito', 'Material actualizado correctamente')
      })


    } else {
      this.msg.msgWarning('Error', 'Enlace no valido')
    }

  }
  guardarGD() {

    if (this.formEnlaceGD.value.enlace.startsWith('https://drive.google.com/')) {
      this.db.collection('cursos').doc(this.data.id).update({
        gdrive: this.formEnlaceGit.value.enlace
      }).finally(() => {
        this.msg.msgSuccess('Exito', 'Material actualizado correctamente')
      })


    } else {
      this.msg.msgWarning('Error', 'Enlace no valido')
    }

  }
}