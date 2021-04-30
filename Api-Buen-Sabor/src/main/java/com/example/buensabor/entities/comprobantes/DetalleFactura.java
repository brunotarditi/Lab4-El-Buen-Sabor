package com.example.buensabor.entities.comprobantes;

import com.example.buensabor.entities.EntityBean;
import com.example.buensabor.entities.articulos.ArticuloInsumo;
import com.example.buensabor.entities.articulos.ArticuloManufacturado;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.*;
import javax.validation.constraints.NotNull;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Table(name = "detalle_factura")
public class DetalleFactura extends EntityBean {

    @Column(name = "cantidad")
    @NotNull
    private int cantidad;

    @Column(name = "subtotal")
    @NotNull
    private double subtotal;

    @ManyToOne(fetch = FetchType.LAZY,cascade ={CascadeType.DETACH,CascadeType.MERGE,CascadeType.PERSIST,CascadeType.REFRESH})
    @JoinColumn(name = "id_art_insumo")
    private ArticuloInsumo articuloInsumo;

    @ManyToOne(fetch = FetchType.LAZY,cascade ={CascadeType.DETACH,CascadeType.MERGE,CascadeType.PERSIST,CascadeType.REFRESH})
    @JoinColumn(name = "id_art_manufacturado")
    private ArticuloManufacturado articuloManufacturado;

    @ManyToOne(fetch = FetchType.LAZY,cascade ={CascadeType.DETACH,CascadeType.MERGE,CascadeType.PERSIST,CascadeType.REFRESH})
    @JoinColumn(name = "id_factura")
    private Factura factura;
}
