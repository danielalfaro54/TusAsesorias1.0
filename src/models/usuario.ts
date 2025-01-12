import { DocumentReference } from '@angular/fire/firestore';
export class Usuario {
    id: string;
    nombre: string;
    apellido: string;
    correo: string;
    fechaNacimiento: Date;
    img: string;
    tipoUsuario: string;
    ref: DocumentReference
    uid: string
    horario
    bio: string
    evaluaciones: number;
    estudiantes: any;
    fecha: any;
    totalEstudiantes: number;
    cel: string
    mostrarinfo:string
    count: number
}