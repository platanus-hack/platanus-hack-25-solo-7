"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

export function F22Form() {
    return (
        <Tabs defaultValue="upload" className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2 bg-foreground p-1 text-white/60">
                <TabsTrigger
                    value="upload"
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground text-white transition-all duration-300"
                >
                    Subir F22
                </TabsTrigger>
                <TabsTrigger
                    value="manual"
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground text-white transition-all duration-300"
                >
                    Manual
                </TabsTrigger>
            </TabsList>
            <div className="overflow-hidden">
                <TabsContent value="upload" className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <Card className="border-none shadow-none">
                        <CardHeader>
                            <CardTitle>Subir F22</CardTitle>
                            <CardDescription>
                                Sube tu archivo PDF del formulario 22.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="space-y-1">
                                <Label htmlFor="file">Archivo PDF</Label>
                                <Input id="file" type="file" accept=".pdf" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full bg-foreground text-white hover:bg-foreground/90">Subir y Procesar</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="manual" className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <Card className="border-none shadow-none">
                        <CardHeader>
                            <CardTitle>Ingreso Manual</CardTitle>
                            <CardDescription>
                                Ingresa los datos clave de tu F22.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="space-y-1">
                                <Label htmlFor="identificacion_giro">Identificación y giro</Label>
                                <Input id="identificacion_giro" placeholder="Ej: Servicios Informáticos" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="ingresos">Ingresos</Label>
                                <Input id="ingresos" placeholder="$0" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="gastos_rechazados">Gastos rechazados</Label>
                                <Input id="gastos_rechazados" placeholder="$0" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="base_imponible">Base imponible</Label>
                                <Input id="base_imponible" placeholder="$0" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="creditos">Créditos</Label>
                                <Input id="creditos" placeholder="$0" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="impuesto_total_pagado">Impuesto total pagado</Label>
                                <Input id="impuesto_total_pagado" placeholder="$0" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full bg-foreground text-white hover:bg-foreground/90">Guardar Datos</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </div>
        </Tabs>
    )
}
