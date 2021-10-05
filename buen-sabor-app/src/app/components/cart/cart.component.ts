import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Articulo } from 'src/app/models/articulo';
import { ItemCart } from 'src/app/models/item-cart';
import { Domicilio } from 'src/app/models/domicilio';
import { PedidoCreate } from 'src/app/models/pedidoCreate';
import { TipoEnvio } from 'src/app/models/tipo-envio';
import { Usuario } from 'src/app/models/usuario';
import { ArticuloService } from 'src/app/services/articulo.service';
import { AuthService } from 'src/app/services/auth.service';
import { DetallePedidoService } from 'src/app/services/detalle-pedido.service';
import { DomicilioService } from 'src/app/services/domicilio.service';
import { MercadoPagoService } from 'src/app/services/mercado-pago.service';
import { MessageService } from 'src/app/services/message.service';
import { PedidoService } from 'src/app/services/pedido.service';
import { PedidoEstadoService } from 'src/app/services/pedidoEstado.service';
import { StorageService } from 'src/app/services/storage.service';
import { TipoEnvioService } from 'src/app/services/tipo-envio.service';
import { TokenService } from 'src/app/services/token.service';
import Swal from 'sweetalert2';
import * as SockJS from 'sockjs-client';
import * as Stomp from '@stomp/stompjs';
import { Localidad } from 'src/app/models/localidad';
import { LocalidadService } from 'src/app/services/localidad.service';
import { DomicilioForm } from 'src/app/models/domicilio-form';
import { Router } from '@angular/router';
import { ArticuloElaboradoDetalle } from 'src/app/models/articulo-elaborado-detalle';
import { RecetaElaborado } from 'src/app/models/receta-elaborado';
import { InventarioService } from 'src/app/services/inventario.service';
import { RecetaElaboradoService } from 'src/app/services/receta-elaborado.service';
import { ArticuloElaboradoDetalleService } from 'src/app/services/articulo-elaborado-detalle.service';

const EMAIL_BUENSABOR = 'bsabor2021@gmail.com';
@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent implements OnInit {

  // atributos
  cartItems: any = [];
  tiposEnvios: TipoEnvio[];
  domicilios: Domicilio[];
  localidades: Localidad[];
  articuloDetalle: ArticuloElaboradoDetalle;
  recetasElaborados: RecetaElaborado[] = [];
  usuario: Usuario;
  localidad: Localidad;
  paymentMethod: any;
  idShippingType: number;
  idPaymentMethod: number;
  idAddress: number;
  total: number;
  openForm: boolean;
  emailUser: string;
  webSocketEndPoint: string;
  disabled: boolean;
  stompClient: any;
  message:string;
  formAddress: FormGroup;

  

  // constructor
  constructor(
    private messageService: MessageService,
    private router: Router,
    private storageService: StorageService,
    private mercadoPagoService: MercadoPagoService,
    private tipoEnvioService: TipoEnvioService,
    private domicilioService: DomicilioService,
    private pedidoEstadoService: PedidoEstadoService,
    private pedidoService: PedidoService,
    private tokenService: TokenService,
    private authService: AuthService,
    private articuloService: ArticuloService,
    private detallePedidoService: DetallePedidoService,
    private localidadService: LocalidadService,
    private articuloDetalleService: ArticuloElaboradoDetalleService,
    private recetaService: RecetaElaboradoService,
    private inventarioService: InventarioService,
  ) {
    this.paymentMethod = ['Efectivo', 'Mercado Pago'];
    this.idShippingType = 0;
    this.idAddress = 0;
    this.total = 0;
    this.openForm = false;
    this.webSocketEndPoint = 'http://localhost:8080/ws';
    this.message = 'Ingresó un nuevo pedido.';
    this.disabled = true;
    
    // Formulario para domicilio
    this.formAddress = new FormGroup({
      id: new FormControl(''),
      calle: new FormControl('', [Validators.required]),
      numero: new FormControl('', [Validators.required, Validators.maxLength(4)]),
      idLocalidad: new FormControl('', [Validators.required]),
      fechaBaja: new FormControl(''),
      usuario: new FormControl('')
    })
  }

  ngOnInit(): void {
    this.emailUser = this.tokenService.getUserName()
    this.getUser(this.emailUser);
    if (this.storageService.existCart()) {
      this.cartItems = this.storageService.getCart();
    }
    this.getItem();
    this.total = this.getTotal();
  }

  /**
   * Método void para recargar la página
   */
  refresh(): void {
    this.router.navigate(['/'])
    location.reload()
  }

  /**
   * Método void que obtiene el articulo y lo añade al carrito
   */
  getItem(): void {
    this.messageService.getMessage().subscribe((articulo: Articulo) => {
      this.articuloDetalleService.getArtElaboradoDetalleByArticuloId(articulo.id).subscribe(detalles => {
        this.recetaService.getRecetaByArticuloDetalleId(detalles.id).subscribe(recetas => {
          this.inventarioService.getInventarios().subscribe(inventarios => {
            console.log(recetas)
            console.log(inventarios)
          })
        })
      })
      let exist = false;
      this.cartItems.forEach((item: { id: number; cantidad: number }) => {
        if (item.id === articulo.id) {
          exist = true;
          item.cantidad++;
        }
      });
      if (!exist) {
        const cartItem = new ItemCart(articulo);
        this.cartItems.push(cartItem);
      }
      this.total = this.getTotal();
      this.storageService.setCart(this.cartItems);
    });
  }
  /**
   * Este método itera sobre los items del carrito y suma al total el precio por la cantidad de cada item
   * @returns el precio total del carrito
   */
  getTotal(): number {
    let total = 0;
    this.cartItems.forEach((item: { cantidad: number; precio: number }) => {
      total += item.cantidad * item.precio;
    });
    return +total.toFixed(2);
  }

  /**
   * Método void que limpia el carrito completamente
   */
  emptyCart(): void {
    this.cartItems = [];
    this.total = 0;
    this.storageService.clear();
  }

  /**
   * Elimina el item reduciendo la cantidad
   * @param i Recibe por parametro el indice del item 
   */
  deleteItem(i: number): void {
    if (this.cartItems[i].cantidad > 1) {
      this.cartItems[i].cantidad--;
    } else {
      this.cartItems.splice(i, 1);
    }
    this.total = this.getTotal();
    this.storageService.setCart(this.cartItems);
  }

  /**
   * Método void que finaliza la compra dependiendo de la forma de pago
   * Si tipo envio es 1 (retiro) Y metodo de pago es 0 (efectivo)
   * Si no Si tipo envio es 1 (retiro) Y metodo de pago es 1 (Mercado Pago)
   * Si No tipo envio es 2 (domicilio) Y metodo de pago es 1(Mercado Pago)
   */
  toPay(): void {
    if (this.idShippingType == 1 && this.idPaymentMethod == 0) {
      this.authService.getDataUsuario(EMAIL_BUENSABOR).subscribe((dataUsuario) => {
        this.tipoEnvioService.getTipoEnvioById(this.idShippingType).subscribe((dataTipoEnvio) => {
          this.pedidoEstadoService.getPedidoEstadoById(1).subscribe((dataPedidoEstado) => {
            this.domicilioService.getDomicilioByUserId(dataUsuario.id).subscribe((dataDomicilio) => {
              let pedido = new PedidoCreate(0, new Date(), this.total, this.usuario, dataTipoEnvio, dataPedidoEstado, dataDomicilio[0])
              this.stompClient.send('/app/pedidos', {}, JSON.stringify(pedido));
              this.pedidoService.savePedido(pedido).subscribe(data => {
                this.cartItems.forEach((item: any) => {
                  this.articuloService.getArticuloById(item.id).subscribe((dataArticulo) => {
                    let detallePedido = { "id": 0, "cantidad": item.cantidad, "subtotal": item.precio, "articulo": dataArticulo, "pedido": data }
                    this.detallePedidoService.saveDetallePedido(detallePedido).subscribe();
                  })
                });
                Swal.fire({
                  title: 'Pedido realizado con éxito',
                  icon: 'success',
                  text: 'Gracias por confiar en el Buen Sabor 🍕',
                }).then(res => {
                  this.stompClient.send('/app/mensajes', {}, JSON.stringify({'message':this.message}));
                  this.emptyCart();
                  this.refresh();
                });
              });
            });
          });
        });
      });


    } else {
      if (this.idShippingType == 1 && this.idPaymentMethod == 1) {
        this.authService.getDataUsuario(EMAIL_BUENSABOR).subscribe((dataUsuario) => {
          this.tipoEnvioService.getTipoEnvioById(this.idShippingType).subscribe((dataTipoEnvio) => {
            this.pedidoEstadoService.getPedidoEstadoById(1).subscribe((dataPedidoEstado) => {
              this.domicilioService.getDomicilioByUserId(dataUsuario.id).subscribe((dataDomicilio) => {
                let pedido = new PedidoCreate(0, new Date(), this.total, dataUsuario, dataTipoEnvio, dataPedidoEstado, dataDomicilio[0])
                this.savePedidoAndDetallePedido(pedido);
              });
            });
          });
        });

      } else if (this.idShippingType == 2 && this.idPaymentMethod == 1) {
        this.tipoEnvioService.getTipoEnvioById(this.idShippingType).subscribe((dataTipoEnvio) => {
          this.pedidoEstadoService.getPedidoEstadoById(1).subscribe((dataPedidoEstado) => {
            this.domicilioService.getDomicilioById(this.idAddress).subscribe((dataDomicilio) => {
              let pedido = new PedidoCreate(0, new Date(), this.total, this.usuario, dataTipoEnvio, dataPedidoEstado, dataDomicilio)
              this.savePedidoAndDetallePedido(pedido);
            });
          });
        });
      }

    }
  }
  /**
   * Captura el valor del radio button del tipo envio
   */
  captureShippingValue(event: any): void {
    
    this.cartItems.forEach((item: any) => {
      console.log(item)
    });
    this.idShippingType = event.target.value;
    this.idAddress = 0;
    this.listAddress(this.usuario.id);
  }

  /** 
   * Captura el valor del radio button de la forma de pago
   */
  capturePaymentMethod(event: any): void {
    this.idPaymentMethod = event.target.value;
  }

  /** 
  * Captura el valor del radio button del domicilio
  */
  captureAddressValue(event: any): void {
    this.idAddress = event.target.value;
  }

  /**
   * Método void que a través del servicio de Tipo Envio, lista todos los tipos envios de la base de datos 
   */
  listShippingType(): void {
    this.connect();
    this.tipoEnvioService.getTiposEnvios().subscribe((data) => {
      this.tiposEnvios = data;
    })
  }
  /**
   * Método void que a través del servicio de Domicilio, lista todos los domicilios de la base de datos
   */
  listAddress(id: number): void {
    this.domicilioService.getDomicilioByUserId(id).subscribe((data) => {
      this.domicilios = data;
    })
  }

  /**
   * Regresa a 0 el id del Domicilio y id de Tipo Envio de los Radio Button
   */
  restoreShippingType(): void {
    this.idAddress = 0;
    this.idShippingType = 0;
  }

  /**
   * Evalua si el retiro envio fue seleccionado y habilita el botón siguiente
   * En caso de envio a domicilio, debe elegir un domicilio sino el botón sigue inhabilido
   * @returns valor true o false según corresponda
   */
  checkShippingType(): boolean {
    if (this.idShippingType == 2 && this.idAddress > 0) {
      return false;
    } else if (this.idShippingType == 1) {
      return false;
    } else {
      return true;
    }
  }

  /**
   * Recupera la información completa del usuario mediante el correo electrónico
   * @param email 
   */
  getUser(email: string): void {
    this.authService.getDataUsuario(email).subscribe((data) => {
      this.usuario = data;
    });
  }

  /**
   * Guarda un pedido y de acuerdo a cada item cargado en el carrito, los persiste luego de persistir el pedido
   * @param pedido 
   */
  savePedidoAndDetallePedido(pedido: PedidoCreate): void {
    this.stompClient.send('/app/pedidos', {}, JSON.stringify(pedido));
    this.pedidoService.savePedido(pedido).subscribe(data => {
      this.cartItems.forEach((item: any) => {
        this.articuloService.getArticuloById(item.id).subscribe((dataArticulo) => {
          let detallePedido = { "id": 0, "cantidad": item.cantidad, "subtotal": item.precio, "articulo": dataArticulo, "pedido": data }
          this.detallePedidoService.saveDetallePedido(detallePedido).subscribe();
        })
      });
      Swal.fire({
        title: 'Pedido realizado con éxito',
        icon: 'success',
        text: 'Gracias por confiar en el Buen Sabor 🍕',
      }).then(res => {
        this.stompClient.send('/app/mensajes', {}, JSON.stringify({'message':this.message}));
        this.mercadoPagoService.redirectMercadoPago(this.total).subscribe(
          (data) => {
            window.location.href = data;
          },
          (err) => {
            console.log(err.error.text);
          }
        );
      });
    });
  }

  /**
   * Abre el formulario para cargar un domicilio
   */
  clickOpenForm(): void {
    this.openForm = true;
    this.listLocalities();
  }
  /**
   * Cierra el formulario para cargar un domicilio
   */
  clickCloseForm(): void {
    this.openForm = false;
  }

  /**
   * Mediante petición post envía un domicilio al servidor para persistirlo
   * @param form 
   */
   saveNewAddress(form: DomicilioForm): void {
    this.localidadService.getLocalidadById(form.idLocalidad).subscribe((localidad) => {
      let domicilio = { "id": 0, "calle": form.calle, "numero": form.numero, "localidad": localidad, "fechaBaja": null, "usuario": this.usuario };
      this.domicilios.push(domicilio);
      this.domicilioService.saveDomicilio(domicilio).subscribe();
      this.formAddress.reset();
    })
  }

  // prueba(form: DomicilioForm): void {
  //   this.localidadService.getLocalidadById(form.idLocalidad).pipe(
  //     concatMap(val => {
  //         return this.localidadService.getLocalidadById(form.idLocalidad).pipe();
  //       }
  //     )
  //   ).subscribe(data => {
  //     console.log(data)
  //   })
  // }


  /**
   * @param form
   * @description Mediante petición post envía un domicilio existente al servidor para persistirlo
   * lo elimina de manera lógica por fecha
   */
  deleteAddress(id: number): void {
    this.domicilios = this.domicilios.filter((item) => item.id !== id);
    this.domicilioService.getDomicilioById(id).subscribe((dataDomicilio) => {
      let domicilio = { "id": dataDomicilio.id, "calle": dataDomicilio.calle, "numero": dataDomicilio.numero, "localidad": dataDomicilio.localidad, "fechaBaja": new Date(), "usuario": this.usuario };
      this.domicilioService.saveDomicilio(domicilio).subscribe();
    })
  }

  listLocalities(): void {
    this.localidadService.getLocalidades().subscribe((localidad) => {
      this.localidades = localidad;
    })
  }

  connect() {
    const socket = new SockJS(this.webSocketEndPoint);
    this.stompClient = Stomp.over(socket);
    const _this = this;
    _this.stompClient.connect({},  (frame: any) => {
      console.log('Connected: ' + frame)
    })
  }

  disconnect() {
    if (this.stompClient != null) {
      this.stompClient.disconnect();
    }

    console.log('Disconnected!');
  }

}
