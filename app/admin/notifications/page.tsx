"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bell,
  Check,
  RefreshCw,
  Loader2,
  CheckCheck,
  Filter,
  Trash2,
  ArrowUpDown,
  BellOff,
  X,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Notification {
  id: string;
  title: string;
  message: string;
  category: string;
  isRead: boolean;
  createdAt: string;
}

// Datos de ejemplo
const mockNotifications: Notification[] = [
  {
    id: "notif1",
    title: "Nuevo estudiante registrado",
    message: "El estudiante Carlos Martínez se ha registrado en la plataforma.",
    category: "students",
    isRead: false,
    createdAt: "2025-04-22T10:30:00Z",
  },
  {
    id: "notif2",
    title: "Nueva tarea creada",
    message:
      "El profesor Luis Ramírez ha creado una nueva tarea en la materia Matemáticas Avanzadas.",
    category: "homeworks",
    isRead: false,
    createdAt: "2025-04-21T15:45:00Z",
  },
  {
    id: "notif3",
    title: "Nueva entrega pendiente de calificación",
    message:
      "El estudiante Ana García ha realizado una entrega para la tarea 'Ejercicios de Álgebra' en Matemáticas Avanzadas.",
    category: "submissions",
    isRead: true,
    createdAt: "2025-04-20T09:15:00Z",
  },
  {
    id: "notif4",
    title: "Materia activada",
    message:
      "La materia 'Programación Avanzada' ha sido activada y ahora está disponible para inscripciones.",
    category: "subjects",
    isRead: true,
    createdAt: "2025-04-18T14:20:00Z",
  },
  {
    id: "notif5",
    title: "Actualización del sistema",
    message:
      "Se ha realizado una actualización importante del sistema. Por favor revisa los cambios.",
    category: "system",
    isRead: false,
    createdAt: "2025-04-17T08:30:00Z",
  },
  {
    id: "notif6",
    title: "Nuevo profesor registrado",
    message: "El profesor Marta Sánchez se ha unido a la plataforma.",
    category: "teachers",
    isRead: true,
    createdAt: "2025-04-15T11:45:00Z",
  },
  {
    id: "notif7",
    title: "Fecha límite próxima",
    message:
      "La tarea 'Proyecto Final' en Diseño Web tiene fecha límite en 3 días.",
    category: "homeworks",
    isRead: false,
    createdAt: "2025-04-14T16:20:00Z",
  },
  {
    id: "notif8",
    title: "Nueva calificación registrada",
    message:
      "El profesor Roberto Méndez ha calificado la entrega del estudiante Juan Pérez.",
    category: "grades",
    isRead: true,
    createdAt: "2025-04-13T10:10:00Z",
  },
];

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );
  const [selectAll, setSelectAll] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  // Cargar notificaciones (simulación)
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setNotifications(mockNotifications);
      setFilteredNotifications(mockNotifications);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Aplicar filtros y ordenación
  useEffect(() => {
    if (!notifications.length) return;

    setIsLoading(true);

    let result = [...notifications];

    // Filtro por categoría
    if (categoryFilter !== "all") {
      result = result.filter(
        (notification) => notification.category === categoryFilter
      );
    }

    // Filtro por estado de lectura
    if (readFilter !== "all") {
      const isRead = readFilter === "read";
      result = result.filter((notification) => notification.isRead === isRead);
    }

    // Búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (notification) =>
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query)
      );
    }

    // Ordenación
    result = result.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "date-desc":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    setFilteredNotifications(result);
    setIsLoading(false);

    // Reset selection when filters change
    setSelectedNotifications([]);
    setSelectAll(false);
  }, [notifications, categoryFilter, readFilter, searchQuery, sortBy]);

  // Manejar seleccionar/deseleccionar todo
  useEffect(() => {
    if (selectAll) {
      setSelectedNotifications(filteredNotifications.map((n) => n.id));
    } else if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    }
  }, [selectAll]);

  // Verificar si todos los elementos están seleccionados
  useEffect(() => {
    if (
      filteredNotifications.length > 0 &&
      selectedNotifications.length === filteredNotifications.length
    ) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedNotifications, filteredNotifications]);

  // Manejar marcar como leída/no leída
  const handleToggleRead = (ids: string[], isRead: boolean) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        ids.includes(notification.id)
          ? { ...notification, isRead }
          : notification
      )
    );

    toast.success(
      isRead
        ? `${ids.length} notificación(es) marcada(s) como leída(s)`
        : `${ids.length} notificación(es) marcada(s) como no leída(s)`
    );

    // Limpiar selección después de la acción
    setSelectedNotifications([]);
  };

  // Manejar eliminación de notificaciones
  const handleDelete = (ids: string[]) => {
    setNotifications((prev) =>
      prev.filter((notification) => !ids.includes(notification.id))
    );

    toast.success(`${ids.length} notificación(es) eliminada(s)`);

    // Limpiar selección después de la acción
    setSelectedNotifications([]);
    setDeleteDialogOpen(false);
  };

  // Manejar marcar todas como leídas
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );

    toast.success("Todas las notificaciones marcadas como leídas");
  };

  // Manejar selección de notificación individual
  const toggleSelection = (id: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  // Obtener categoría formateada
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "students":
        return "Estudiantes";
      case "teachers":
        return "Profesores";
      case "subjects":
        return "Materias";
      case "homeworks":
        return "Tareas";
      case "submissions":
        return "Entregas";
      case "grades":
        return "Calificaciones";
      case "system":
        return "Sistema";
      default:
        return category;
    }
  };

  // Obtener color de la categoría
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "students":
        return "bg-blue-500/10 text-blue-500";
      case "teachers":
        return "bg-green-500/10 text-green-500";
      case "subjects":
        return "bg-purple-500/10 text-purple-500";
      case "homeworks":
        return "bg-amber-500/10 text-amber-500";
      case "submissions":
        return "bg-pink-500/10 text-pink-500";
      case "grades":
        return "bg-cyan-500/10 text-cyan-500";
      case "system":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Calcular tiempo relativo
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 1) {
      return format(date, "d MMM, HH:mm", { locale: es });
    } else if (diffDays === 1) {
      return "ayer";
    } else if (diffHours >= 1) {
      return `hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
    } else if (diffMins >= 1) {
      return `hace ${diffMins} minuto${diffMins > 1 ? "s" : ""}`;
    } else {
      return "ahora mismo";
    }
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notificaciones</h1>
          <p className="text-muted-foreground">
            Gestiona tus notificaciones y actualizaciones
          </p>
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 size-4" />
                Acciones
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones Masivas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={markAllAsRead}>
                <CheckCheck className="mr-2 size-4" />
                Marcar todas como leídas
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDeletingAll(true);
                  setDeleteDialogOpen(true);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                Borrar todas las notificaciones
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => {
                setNotifications(mockNotifications);
                setIsLoading(false);
                toast.success("Notificaciones actualizadas");
              }, 1000);
            }}
          >
            <RefreshCw className="mr-2 size-4" />
            Actualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>Todas las Notificaciones</CardTitle>
              <CardDescription>
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Cargando...
                  </div>
                ) : (
                  `Mostrando ${filteredNotifications.length} de ${notifications.length} notificaciones`
                )}
              </CardDescription>
            </div>

            <div className="flex gap-2">
              {selectedNotifications.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleToggleRead(selectedNotifications, true)
                    }
                  >
                    <Check className="mr-2 size-4" />
                    Marcar como leída
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleToggleRead(selectedNotifications, false)
                    }
                  >
                    <BellOff className="mr-2 size-4" />
                    Marcar como no leída
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Eliminar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar notificaciones..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="students">Estudiantes</SelectItem>
                  <SelectItem value="teachers">Profesores</SelectItem>
                  <SelectItem value="subjects">Materias</SelectItem>
                  <SelectItem value="homeworks">Tareas</SelectItem>
                  <SelectItem value="submissions">Entregas</SelectItem>
                  <SelectItem value="grades">Calificaciones</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>

              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="unread">No leídas</SelectItem>
                  <SelectItem value="read">Leídas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Más recientes</SelectItem>
                  <SelectItem value="date-asc">Más antiguas</SelectItem>
                  <SelectItem value="title-asc">Título (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Título (Z-A)</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                  setReadFilter("all");
                  setSortBy("date-desc");
                }}
                disabled={
                  !searchQuery &&
                  categoryFilter === "all" &&
                  readFilter === "all" &&
                  sortBy === "date-desc"
                }
              >
                Limpiar filtros
              </Button>
            </div>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={(checked) => {
                        setSelectAll(!!checked);
                      }}
                      aria-label="Seleccionar todo"
                    />
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 -ml-3 font-medium"
                      onClick={() =>
                        setSortBy(
                          sortBy === "title-asc" ? "title-desc" : "title-asc"
                        )
                      }
                    >
                      Título
                      <ArrowUpDown className="size-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 -ml-3 font-medium"
                      onClick={() =>
                        setSortBy(
                          sortBy === "date-asc" ? "date-desc" : "date-asc"
                        )
                      }
                    >
                      Fecha
                      <ArrowUpDown className="size-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="size-8 animate-spin text-primary mx-auto" />
                      <p className="mt-2">Cargando notificaciones...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredNotifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Bell className="size-8 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-lg font-medium mb-1">
                        No hay notificaciones
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-4">
                        {searchQuery ||
                        categoryFilter !== "all" ||
                        readFilter !== "all"
                          ? "No se encontraron notificaciones con los filtros actuales."
                          : "No tienes notificaciones en este momento."}
                      </p>
                      {(searchQuery ||
                        categoryFilter !== "all" ||
                        readFilter !== "all") && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchQuery("");
                            setCategoryFilter("all");
                            setReadFilter("all");
                          }}
                        >
                          Limpiar filtros
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotifications.map((notification) => (
                    <TableRow
                      key={notification.id}
                      className={!notification.isRead ? "bg-muted/30" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedNotifications.includes(
                            notification.id
                          )}
                          onCheckedChange={() =>
                            toggleSelection(notification.id)
                          }
                          aria-label={`Seleccionar ${notification.title}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {!notification.isRead && (
                            <div className="size-2 bg-primary rounded-full inline-block mr-2 align-middle"></div>
                          )}
                          {notification.title}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getCategoryColor(notification.category)}
                        >
                          {getCategoryLabel(notification.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {notification.isRead ? (
                          <Badge variant="outline">Leída</Badge>
                        ) : (
                          <Badge>No leída</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <span>{getRelativeTime(notification.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              handleToggleRead(
                                [notification.id],
                                !notification.isRead
                              )
                            }
                            title={
                              notification.isRead
                                ? "Marcar como no leída"
                                : "Marcar como leída"
                            }
                          >
                            {notification.isRead ? (
                              <BellOff className="size-4" />
                            ) : (
                              <Check className="size-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setSelectedNotifications([notification.id]);
                              setDeleteDialogOpen(true);
                            }}
                            title="Eliminar notificación"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingAll
                ? "Esta acción eliminará todas tus notificaciones. Esta acción no se puede deshacer."
                : selectedNotifications.length > 1
                ? `Esta acción eliminará ${selectedNotifications.length} notificaciones seleccionadas. Esta acción no se puede deshacer.`
                : "Esta acción eliminará la notificación seleccionada. Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingAll(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingAll) {
                  setNotifications([]);
                  toast.success("Todas las notificaciones han sido eliminadas");
                } else {
                  handleDelete(selectedNotifications);
                }
                setDeletingAll(false);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
