'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Gamepad2, Zap, Shield, Cpu, Book, Target, Settings, Trophy, Info, Backpack, Bot, MapPin, RocketIcon, DockIcon } from 'lucide-react'

interface NavItem {
  id: string
  title: string
  icon: React.ReactNode
}

const codeString = `using System.IO;
using UnityEngine;
using TMPro;

/// <summary>
/// Nodo de una lista enlazada simple para almacenar un record.
/// </summary>
public class RecordNode
{
    public string playerName;
    public int timeSeconds;      // tiempo en segundos (para ordenar)
    public string timeString;    // como se muestra (ej: "1:23")
    public RecordNode next;

    public RecordNode(string name, int seconds, string timeStr)
    {
        playerName = name;
        timeSeconds = seconds;
        timeString = timeStr;
        next = null;
    }
}

public class ScoreSaver : MonoBehaviour
{
    [Header("Referencias UI")]
    public TMP_Text TextTime;            // Texto que muestra el tiempo final (TMP)
    public TMP_InputField nameInput;     // Input del nombre (TMP)

    string filePath;

    // CABEZA de la lista enlazada simple
    private RecordNode head = null;

    void Awake()
    {
        // Buscar TextTime automáticamente si no está asignado
        if (TextTime == null)
        {
            GameObject go = GameObject.Find("TextTime");  // 👈 nombre del objeto en tu jerarquía
            if (go != null)
            {
                // coge el TMP_Text que haya en ese objeto o en sus hijos
                TextTime = go.GetComponentInChildren<TMP_Text>();
            }
        }

        if (TextTime == null)
        {
            Debug.LogError("ScoreSaver: TextTime sigue siendo NULL, revisa el nombre del objeto o la jerarquía.");
        }

        string basePath;
#if UNITY_EDITOR
        basePath = Application.dataPath;
#else
        basePath = Application.persistentDataPath;
#endif
        string folder = Path.Combine(basePath, "guardados");
        Directory.CreateDirectory(folder);
        filePath = Path.Combine(folder, "records.txt");
        Debug.Log("Ruta archivo records: " + filePath);

        // Cargar los records existentes desde el archivo a la lista enlazada
        CargarRecordsDesdeArchivo();
    }

    // Llamar desde el botón "Guardar"
    public void GuardarRecord()
    {
        string playerName = nameInput != null ? nameInput.text : string.Empty;
        if (string.IsNullOrWhiteSpace(playerName))
            playerName = "SinNombre";

        if (TextTime == null)
        {
            Debug.LogError("ScoreSaver: TextTime es NULL al guardar, no puedo leer el tiempo.");
            return;
        }

        // Leer EXACTAMENTE lo que muestra el texto en pantalla
        string rawDisplayedTime = TextTime.text ?? "0";

        // Convertir el tiempo mostrado a segundos para poder ordenar
        int seconds = ParseTimeToSeconds(rawDisplayedTime);

        // Crear nuevo nodo de record
        RecordNode nuevo = new RecordNode(playerName, seconds, rawDisplayedTime);

        // Insertar en la lista enlazada simple manteniendo el orden (menor tiempo primero)
        InsertarOrdenado(nuevo);

        // Guardar toda la lista de nuevo en el archivo
        GuardarListaEnArchivo();

        Debug.Log("Record guardado en lista y archivo: " + playerName + " ; " + rawDisplayedTime);
    }

    /// <summary>
    /// Convierte un string de tiempo tipo "mm:ss" o "m:ss" a segundos.
    /// Si falla, intenta parsear como segundos directos.
    /// </summary>
    private int ParseTimeToSeconds(string timeStr)
    {
        if (string.IsNullOrWhiteSpace(timeStr))
            return 0;

        // Intentar formato "mm:ss"
        string[] parts = timeStr.Split(':');
        if (parts.Length == 2)
        {
            int min, sec;
            if (int.TryParse(parts[0], out min) && int.TryParse(parts[1], out sec))
            {
                return min * 60 + sec;
            }
        }

        // Si no tiene ":", intentar como entero directo
        int total;
        if (int.TryParse(timeStr, out total))
            return total;

        // Si todo falla, devolver 0
        return 0;
    }

    /// <summary>
    /// Inserta un nodo en la lista enlazada simple de forma ordenada (ascendente por tiempo).
    /// </summary>
    private void InsertarOrdenado(RecordNode nuevo)
    {
        // Caso 1: lista vacía o el nuevo es menor que la cabeza
        if (head == null || nuevo.timeSeconds < head.timeSeconds)
        {
            nuevo.next = head;
            head = nuevo;
            return;
        }

        // Caso 2: buscar la posición adecuada en la lista
        RecordNode actual = head;
        while (actual.next != null && actual.next.timeSeconds <= nuevo.timeSeconds)
        {
            actual = actual.next;
        }

        // Insertar entre 'actual' y 'actual.next'
        nuevo.next = actual.next;
        actual.next = nuevo;
    }

    /// <summary>
    /// Carga el contenido del archivo en la lista enlazada simple.
    /// </summary>
    private void CargarRecordsDesdeArchivo()
    {
        head = null; // limpiar por si acaso

        if (!File.Exists(filePath))
        {
            Debug.Log("No existe archivo de records, se creará al guardar.");
            return;
        }

        try
        {
            string[] lineas = File.ReadAllLines(filePath);
            foreach (string linea in lineas)
            {
                if (string.IsNullOrWhiteSpace(linea))
                    continue;

                // Se espera formato "Nombre ; tiempoString"
                string[] partes = linea.Split(';');
                if (partes.Length < 2)
                    continue;

                string nombre = partes[0].Trim();
                string tiempoTexto = partes[1].Trim();

                int segundos = ParseTimeToSeconds(tiempoTexto);
                RecordNode nodo = new RecordNode(nombre, segundos, tiempoTexto);

                // Insertar ordenado para que la lista ya quede en orden al cargar
                InsertarOrdenado(nodo);
            }

            Debug.Log("Records cargados en lista enlazada.");
        }
        catch (System.Exception ex)
        {
            Debug.LogError("Error al leer records: " + ex.Message);
        }
    }

    /// <summary>
    /// Recorre la lista enlazada y guarda todas las líneas en el archivo.
    /// </summary>
    private void GuardarListaEnArchivo()
    {
        try
        {
            using (StreamWriter writer = new StreamWriter(filePath, false))
            {
                RecordNode actual = head;
                while (actual != null)
                {
                    string linea = actual.playerName + " ; " + actual.timeString;
                    writer.WriteLine(linea);
                    actual = actual.next;
                }
            }
        }
        catch (System.Exception ex)
        {
            Debug.LogError("Error al escribir records: " + ex.Message);
        }
    }

    // OPCIONAL: método para depurar la lista en consola
    public void DebugImprimirLista()
    {
        RecordNode actual = head;
        int i = 1;
        while (actual != null)
        {
            Debug.Log($"#{i} {actual.playerName} - {actual.timeString} ({actual.timeSeconds} s)");
            actual = actual.next;
            i++;
        }
    }

    // OPCIONAL: podrías hacer un método para llenar un ScrollView recorriendo la lista
    // public void RellenarScrollView(Transform contenedor, GameObject prefabItem) { ... }
}`;

const navItems: NavItem[] = [
  { id: 'inicio', title: 'Inicio', icon: <Book className="w-4 h-4" /> },
  { id: 'controles', title: 'Controles', icon: <Gamepad2 className="w-4 h-4" /> },
  { id: 'mecanicas', title: 'Mecánicas', icon: <Cpu className="w-4 h-4" /> },
  { id: 'personajes/entidades', title: 'Personajes/Entidades', icon: <Bot className="w-4 h-4" /> },
  { id: 'mapas', title: 'Mapas', icon: <MapPin className="w-4 h-4" /> },
  { id: 'equipo de desarrollo', title: 'Equipo de desarrollo', icon: <Backpack className="w-4 h-4" /> },
  { id: 'lista simple', title: 'Lista Simple', icon: <Shield className="w-4 h-4" /> },
  { id: 'UML', title: 'UML', icon: <RocketIcon className="w-4 h-4" /> },
  { id: 'Referencias', title: 'Referencias', icon: <DockIcon className="w-4 h-4" /> },
]

const glossaryTerms = [
  { term: 'Video', definition: 'https://youtu.be/wrzcrfEBpZI' },
  { term: 'Informe', definition: 'https://uninorte-my.sharepoint.com/:b:/g/personal/doandrade_uninorte_edu_co/IQAXprkmbz9CTqhU-TVj8L0bAb4S3jajNcPoFr1IAJSIiuY?e=VD0OMB' },
]

const quickTips = [
  'corre y no mires atrás',
  'No recojas letras sin planear tu ruta de escape',
  'Las esquinas son trampas… úsalas con cuidado.',
  'Si te quedas sin salida, retrocede antes de que el sistema reaccione',
  'La velocidad no siempre gana. A veces sobrevivir es esperar',
]

const mechanics = [
  {num: '1. Exploración del laberinto', definition: 'El jugador se desplaza por un laberinto digital previamente generado, moviéndose en ocho direcciones (arriba, abajo, izquierda, derecha y diagonales). El mapa contiene pasillos estrechos, áreas bloqueadas y rutas alternativas que obligan al jugador a planificar su recorrido' },
  {num: '2. Recolección de letras clave', definition: 'El objetivo principal del jugador es recoger letras distribuidas de manera aleatoria en el laberinto para completar una contraseña.' },
  {num: '3. Evitar enemigos (Antivirus)', definition: 'Los enemigos representan programas antivirus con patrones de inteligencia artificial básicos.' },
  {num: '4. Terminal final y finalización del nivel', definition: 'Una vez completada la contraseña, el jugador debe llegar a la terminal de salida, un punto específico del mapa. Activarla completa el nivel y registra la puntuación y tiempo del jugador.' },
]

const workers = [
  {name: 'Daniel Andrade', mail: 'doandrade@uninorte.edu.co', role: 'Director de diseño'},
  {name: 'Iván Carbonell', mail: 'idiguaran@uninorte.edu.co', role: 'Director de UI/UX'},
  {name: 'jesus contreras', mail: 'contrerasherrera@uninorte.edu.co', role: 'Director de documentacion'},
  {name: 'Álvaro Useche', mail: 'useche@uninorte.edu.co', role: 'Gerente de Proyecto'},
]

const references =[
  {name: '1.', link: 'F. Pacheco, D. Staino y M. Sliafertas, Educación en ciberseguridad mediante estrategias de gamificación, ResearchGate, 2023. Disponible en: https://www.researchgate.net/publication/385096975_Educacion_en_ciberseguridad_mediante_estrategias_de_Gamificacion'},
  {name: '2.', link: 'R. Pozo Garrote, Diseño de actividades gamificadas para la enseñanza de amenazas digitales, Trabajo de Fin de Grado, Universidad de Val ladolid, 2022. Disponible en: https://uvadoc.uva.es/handle/10324/57441'},
  {name: '3.', link: 'R. Carrasco, Videojuego educativo STEM para la enseñanza de conceptos básicos de ciberseguridad, Tesis de Maestría, 2023.'},
  {name: '4.', link: 'J. A. Fernández Souto, “Experimentos de ciberseguridad: Unity como motor de desarrollo,” Artículo académico, 2025.'},
  {name: '5.', link: 'V. M. P. Menaa, E. X. G. Freirea y J. M. B. Manzanoa, “Usabilidad del software: revisión conceptual y parámetros de evaluación,” Revista Iberoamericana de Tecnología Educativa, vol. 16, no 2, pp. 45–62, 2021.'},
  {name: '6.', link: 'C. Moumouh, J. A. García, M. Y. Mychkouri y J. F. Alemán, “Serious games for teaching information security and privacy: A systematic literature review,” International Journal of Serious Games, vol. 12, no 1, pp. 1–24, 2025.'},
  {name: '7.', link: 'M. Hendrix, E. Al-Sherbaz y T. Bloom, “Game-based learning for cyber security awareness,” International Journal of Serious Games, vol. 3, no 1, pp. 53–61, 2016.'},
  {name: '8.', link: 'M. Jelo, M. Helebrandt y P. Helebrandt, “Gamification of cyber ranges in cybersecurity education,” en Proc. 2021 IEEE 19th International Con ference on Emerging eLearning Technologies and Applications (ICETA), 2021, pp. 479–484.'},
  {name: '9.', link: 'A. C. da Silveira, A. C. de Oliveira, C. A. Costa y F. Silveira, “EGuess: Usability evaluation for educational games,” RIED. Revista Iberoamericana de Educación a Distancia, vol. 24, no 2, pp. 55–76, 2021.'},
  {name: '10.', link: 'J. Nielsen y R. Molich, “Heuristic evaluation of user interfaces,” en Proc. ACM CHI ’90 Conference on Human Factors in Computing Systems, Seattle, WA, USA, 1990, pp. 249–256.'},
]

export function GameManual() {
  const [activeSection, setActiveSection] = useState('inicio')

  return (
    <div className="min-h-screen bg-background">
      {/* Header Fijo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-primary/30">
        <div className="px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Cpu className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary neon-glow" style={{ fontFamily: 'var(--font-orbitron)' }}>
              ANTIVIRUS CAZA DE LETRAS
            </h1>
            <p className="text-sm text-muted-foreground">Manual del Jugador v2.1</p>
          </div>
        </div>
      </header>

      <div className="pt-20 flex">
        {/* Barra Lateral Izquierda - Navegación */}
        <aside className="fixed left-0 top-20 bottom-0 w-[20%] bg-sidebar border-r border-sidebar-border overflow-y-auto scrollbar-thin">
          <nav className="p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Índice de Contenidos
            </h2>
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === item.id
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    }`}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Contenido Principal Central */}
        <main className="ml-[20%] mr-[20%] w-[60%] p-8 space-y-8">
          {activeSection === 'inicio' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2 text-primary" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  Bienvenido a ANTIVIRUS CAZA DE LETRAS
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Eres el malware. Ellos son la defensa. Que empiece la cacería.
                </p>
              </div>

              <Alert className="bg-primary/10 border-primary/50">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-foreground">
                  <strong className="text-primary">Nota Importante:</strong> Este manual contiene toda la información necesaria para entender el juego. Consulta cada sección según tus necesidades.
                </AlertDescription>
              </Alert>

              <Card className="p-6 bg-card border-border">
                <h3 className="text-xl font-bold mb-4 text-accent">Historia</h3>
                <p className="text-foreground leading-relaxed mb-4">
                 En las profundidades de un sistema informático altamente protegido, una entidad extraña ha logrado infiltrarse:
un malware experimental, creado por accidente durante una actualización fallida.

Sin un propósito claro, pero con la capacidad de corromper fragmentos de datos, este malware comienza a desplazarse por los pasillos del sistema en busca de letras dispersas, fragmentos necesarios para reconstruir una palabra clave que desbloquea el núcleo del sistema.

Pero no está solo.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Tu objetivo es simple:

Recoge todas las letras, forma la clave… y escapa antes de ser eliminado del sistema para siempre.
                </p>
              </Card>
            </section>
          )}

          {activeSection === 'controles' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2 text-primary" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  Controles
                </h2>
                <p className="text-muted-foreground">Domina estos controles para sobrevivir en el mundo digital.</p>
              </div>

              <Card className="p-6 bg-card border-border">
                <h3 className="text-xl font-bold mb-4 text-accent">Controles de Teclado y Mouse</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-primary">Acción</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-primary">Tecla/Botón</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-primary">Descripción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-foreground">Movimiento</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="font-mono">W A S D</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">Mover personaje en 4 direcciones</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-foreground">Correr</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="font-mono">Shift</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">Aumentar velocidad de movimiento</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-foreground">Saltar</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="font-mono">Espacio</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">Salto estándar</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-foreground">Inventario</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="font-mono">I</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">Abrir menú de inventario</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-foreground">Mapa</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="font-mono">M</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">Ver mapa del mundo</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-foreground">Interactuar</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="font-mono">E</Badge>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">Interactuar con objetos</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <Alert className="bg-accent/10 border-accent/50">
                <Gamepad2 className="h-4 w-4 text-accent" />
                <AlertDescription className="text-foreground">
                  <strong className="text-accent">Tip Pro:</strong> aveces la mejor manera de sobrevivir es adaparse.
                </AlertDescription>
              </Alert>
            </section>
          )}

          {activeSection === 'mecanicas' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2 text-primary" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  Mecánicas
                </h2>
                <p className="text-muted-foreground">
                  Estas son las acciones y comportamientos fundamentales que estructuran la experiencia de juego.
                </p>
              </div>
              <div className="space-y-2">
                {mechanics.map((item, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="font-semibold text-sm text-accent">{item.num}</div>
                    <div className="text-xs text-muted-foreground">{item.definition}</div>
                  </div>
                ))}
              </div>
              
            </section>
          )}

          {activeSection === 'personajes/entidades' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2 text-primary" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  Personajes/Entidades
                </h2>
                <p className="text-muted-foreground">
                  aqui encontrarás todos los personajes y entidades que aparecen en el juego.
                </p>
              </div>
              <div className="flex flex-wrap gap-8 justify-start"> {/* flex-wrap para responsividad, gap-8 para separación */}
      
              {/* Primer Enemigo */}
              <div className="space-y-2">
                <Image
                  src="/images/enemy1.png" 
                  alt="Enemigo Escudo"
                  width={200} 
                  height={200} 
                  className="rounded-lg shadow-2xl border border-primary/50 object-cover" 
                />
               <div className="font-semibold text-sm text-accent">enemigo escudo</div>
              </div>

              {/* Segundo Enemigo */}
              <div className="space-y-2">
                <Image
                  src="/images/enemy2.jpg" 
                  alt="Enemigo Guardián"
                  width={200} 
                  height={200} 
                  className="rounded-lg shadow-2xl border border-primary/50 object-cover"
                />
              <div className="font-semibold text-sm text-accent">enemigo guardian</div>
            </div>

            {/* Tercer Enemigo */}
            <div className="space-y-2">
              <Image
                src="/images/enemy3.jpg" 
                alt="Enemigo Gusano"
                width={200} 
                height={200} 
                className="rounded-lg shadow-2xl border border-primary/50 object-cover"
              />
            <div className="font-semibold text-sm text-accent">enemigo gusano</div>
            </div>
            </div>
            </section>
          )}
          
          {activeSection === 'mapas' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2 text-primary" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  Mapas
                </h2>
                <p className="text-muted-foreground">
                  aqui encontrarás todos los mapas que aparecen en el juego.
                </p>
              </div>
              <div className="space-y-2">
              {/* Mapas imagenes */}
                <Image
                  src="/images/mapa1.jpg" 
                  alt="Logotipo del juego Antivirus Caza de Letras"
                  width={800} 
                  height={400} 
                  className="rounded-lg shadow-2xl border border-primary/50 object-cover" 
                />
                <div className="font-semibold text-sm text-accent">mapa del laberinto 1</div>
                <Image
                  src="/images/mapa2.jpg" 
                  alt="Logotipo del juego Antivirus Caza de Letras"
                  width={800} 
                  height={400} 
                  className="rounded-lg shadow-2xl border border-primary/50 object-cover" 
                />
                <div className="font-semibold text-sm text-accent">mapa del laberinto 2</div>
                <Image
                  src="/images/mapa3.jpg" 
                  alt="Logotipo del juego Antivirus Caza de Letras"
                  width={800} 
                  height={400} 
                  className="rounded-lg shadow-2xl border border-primary/50 object-cover" 
                />
                <div className="font-semibold text-sm text-accent">mapa del laberinto 3</div>
                <Image
                  src="/images/mapa4.jpg" 
                  alt="Logotipo del juego Antivirus Caza de Letras"
                  width={800} 
                  height={400} 
                  className="rounded-lg shadow-2xl border border-primary/50 object-cover" 
                />
                <div className="font-semibold text-sm text-accent">mapa del laberinto 4</div>
                <Image
                  src="/images/mapa5.jpg" 
                  alt="Logotipo del juego Antivirus Caza de Letras"
                  width={800} 
                  height={400} 
                  className="rounded-lg shadow-2xl border border-primary/50 object-cover" 
                />
                <div className="font-semibold text-sm text-accent">mapa del laberinto 5</div>
              </div>
            </section>
          )}

          {activeSection === 'equipo de desarrollo' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2 text-primary" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  Equipo de desarrollo
                </h2>
                <p className="text-muted-foreground">
                  Detrás de este proyecto hay un equipo comprometido que hizo posible cada detalle del juego.
                </p>
              </div>
              <div className="space-y-2">
                {workers.map((item, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="font-semibold text-sm text-accent">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.mail}</div>
                    <div className="text-xs text-muted-foreground">{item.role}</div>
                  </div>
                ))}
              </div>
              
            </section>
          )}

          {activeSection === 'lista simple' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2 text-primary" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  Lista Simple
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  aqui encontraras el codigo de una lista simple que se uso para el videojuego.
                </p>
              </div>
              <Card className="p-6 bg-card border-border">
                <div className="space-y-2">
                  <div>
                    <pre>
                      <code className="language-csharp">
                        {codeString}
                      </code>
                    </pre>
                  </div>
              </div>
              </Card>
            </section>
          )}

          {activeSection === 'UML' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2 text-primary" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  Diagrama de clases
                </h2>
                <p className="text-muted-foreground">
                  aqui encontrarás el diagrama de clases del juego.
                </p>
              </div>
              <div className="space-y-2">
              {/*Imagen del diagrama de clases*/}
                <Image
                  src="/images/UML.png"
                  alt="Logotipo del juego Antivirus Caza de Letras"
                  width={800} 
                  height={400} 
                  className="rounded-lg shadow-2xl border border-primary/50 object-cover" 
                />
                <div className="font-semibold text-sm text-accent">Diagrama UML</div>                
              </div>
            </section>
          )}

          {activeSection === 'Referencias' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2 text-primary" style={{ fontFamily: 'var(--font-orbitron)' }}>
                  Referencias
                </h2>
                <p className="text-muted-foreground">
                  Aquí encontrarás las referencias que utilizamos en este proyecto.
                </p>
              </div>
              <div className="space-y-2">
              {/* Referencias */}
                <div>
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Book className="w-4 h-4" />
                    Referencias
                  </h3>
                  <div className="space-y-2">
                    {references.map((item, index) => (
                      <div key={index} className="p-3 bg-muted/50 rounded-lg border border-border">
                        <div className="font-semibold text-sm text-accent">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.link}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Columna Lateral Derecha - Información Contextual */}
        <aside className="fixed right-0 top-20 bottom-0 w-[20%] bg-sidebar border-l border-sidebar-border overflow-y-auto scrollbar-thin">
          <div className="p-4 space-y-6">
            {/* Glosario */}
            <div>
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                <Book className="w-4 h-4" />
                Links
              </h3>
              <div className="space-y-2">
                {glossaryTerms.map((item, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="font-semibold text-sm text-accent">{item.term}</div>
                    <div className="text-xs text-muted-foreground">{item.definition}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips Rápidos */}
            <div>
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Tips Rápidos
              </h3>
              <div className="space-y-2">
                {quickTips.map((tip, index) => (
                  <div key={index} className="p-3 bg-primary/10 rounded-lg border border-primary/30">
                    <p className="text-xs text-foreground leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
