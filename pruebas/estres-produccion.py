# Prueba de estrés contra PRODUCCIÓN (docs/prueba-de-estres.md): unos 40 jueces simulados durante ~2 minutos.
# Solo hace lo que hace la app; lo que crea (consultas, canalizaciones, prácticas y accesos) se borra después por SQL.
# Uso: python3 -I pruebas/estres-produccion.py <tono.wav>   (un WAV de 1.5 s sin voz, para el micrófono)
import http.cookiejar, json, re, statistics, struct, sys, threading, time, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor

S = 'https://companero-ten.vercel.app'
CITA = re.compile(r'[\[【]\s*D\d+\s*[-‐-―−]\s*\d+')
resultados = {}
candado = threading.Lock()


def anotar(fase, ok, seg, detalle=''):
    with candado:
        resultados.setdefault(fase, []).append((ok, seg, detalle))


class Sesion:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def pedir(self, metodo, ruta, cuerpo=None, tipo='application/json', timeout=90):
        datos = cuerpo if isinstance(cuerpo, (bytes, type(None))) else json.dumps(cuerpo).encode()
        req = urllib.request.Request(S + ruta, data=datos, method=metodo, headers={'Content-Type': tipo, 'User-Agent': 'companero-estres'})
        t0 = time.time()
        try:
            with self.op.open(req, timeout=timeout) as r:
                return r.status, r.read(), dict(r.headers), time.time() - t0
        except urllib.error.HTTPError as e:
            return e.code, e.read(), dict(e.headers), time.time() - t0
        except Exception as e:
            return 0, str(e).encode(), {}, time.time() - t0


def entrar(numero):
    s = Sesion()
    st, b, _, t = s.pedir('POST', '/api/acceso-reloj', {'empresa': 'del-rio', 'numero': numero})
    anotar('1. entrar (número de reloj)', st == 200, t, f'{st}')
    return s if st == 200 else None


def pagina(args):
    s, ruta = args
    st, b, _, t = (s or Sesion()).pedir('GET', ruta)
    anotar('2. páginas', st == 200, t, f'{st} {ruta}')


PREGUNTAS = ['¿Cómo hago una cancelación?', '¿Qué hago si un producto no tiene precio?', '¿Cómo aplico una promoción?',
             '¿Qué debo revisar al cerrar caja?', '¿Cuándo debo llamar al supervisor?',
             'Son las 9 de la mañana. Un cliente lleva cuatro aguas, un café, un pan, una botana y unas galletas, y trae el cupón DESC10. ¿Cuánto le cobro?',
             '¿Cuántos días de vacaciones me tocan al año?', 'Un cliente quiere pagar con vales de despensa, ¿los acepto?']
respuestas = []


def chat(args):
    s, q, fase = args
    st, b, h, t = s.pedir('POST', '/api/chat', {'empresa': 'del-rio', 'mensajes': [{'rol': 'usuario', 'texto': q}]})
    texto = b.decode('utf-8', 'replace')
    citas = len(CITA.findall(texto))
    canaliza = 'CANALIZAR' in texto
    ok = st == 200 and len(texto) > 40 and (citas > 0 or canaliza) and 'No pude responder' not in texto
    anotar(fase, ok, t, f'{st} citas={citas} canaliza={canaliza} prov={h.get("x-proveedor", h.get("X-Proveedor", "?"))} | {q[:40]}')
    if st == 200:
        with candado:
            respuestas.append(texto)


def voz(args):
    s, cuerpo, fase = args
    st, b, h, t = s.pedir('POST', '/api/voz', cuerpo)
    tipo = h.get('Content-Type', h.get('content-type', ''))
    ok = st == 200 and tipo.startswith('audio/mpeg') and len(b) > 1000
    anotar(fase, ok, t, f'{st} {len(b)}B cache={h.get("X-Cache", h.get("x-cache", "-"))} {cuerpo.get("quien", "asistente")}/{cuerpo.get("modo", "resumen")}')


def transcribir(args):
    s, wav = args
    frontera = '----companero'
    cuerpo = (f'--{frontera}\r\nContent-Disposition: form-data; name="empresa"\r\n\r\ndel-rio\r\n'
              f'--{frontera}\r\nContent-Disposition: form-data; name="audio"; filename="t.wav"\r\nContent-Type: audio/wav\r\n\r\n').encode() + wav + f'\r\n--{frontera}--\r\n'.encode()
    st, b, _, t = s.pedir('POST', '/api/transcribir', cuerpo, tipo=f'multipart/form-data; boundary={frontera}')
    anotar('7. micrófono (Whisper, 6 a la vez)', st == 422, t, f'{st}')


def practica(s):
    st, b, _, t = s.pedir('POST', '/api/practica', {'empresa': 'del-rio', 'escenario': '77836f2a-ecd2-49e5-ba7f-30d15f798e1d', 'evaluar': True,
                          'mensajes': [{'rol': 'avatar', 'texto': 'Oiga, me cobró dos veces el refresco.'},
                                       {'rol': 'usuario', 'texto': 'Disculpe, llamo a mi supervisor para que autorice la cancelación.'}]})
    anotar('8. práctica evaluada por IA (6 a la vez)', st == 200 and len(b) > 40, t, f'{st}')


def main():
    wav = open(sys.argv[1], 'rb').read()
    inicio = time.time()
    # 1) 40 entradas a la vez: 25 jueces como 0001 y el resto repartido.
    numeros = ['0001'] * 25 + ['0002'] * 5 + ['0003'] * 5 + ['0004'] * 5
    with ThreadPoolExecutor(40) as ex:
        sesiones = [s for s in ex.map(entrar, numeros) if s]
    # 2) 120 páginas a la vez (públicas y con sesión).
    publicas = ['/', '/entrar', '/acceso', '/acceso/del-rio', '/unirse/8324902D']
    privadas = ['/e/del-rio', '/e/del-rio/asistente', '/e/del-rio/modulos/615b1cf2-f922-4844-813a-d50ac57eb671']
    trabajos = [(None, publicas[i % 5]) for i in range(50)] + [(sesiones[i % len(sesiones)], privadas[i % 3]) for i in range(70)]
    with ThreadPoolExecutor(40) as ex:
        list(ex.map(pagina, trabajos))
    # 3) Ola 1: 10 preguntas al chat a la vez. 4) Ola 2: 20 a la vez (el techo de Groq por minuto).
    with ThreadPoolExecutor(10) as ex:
        list(ex.map(chat, [(sesiones[i], PREGUNTAS[i % 8], '3. chat, ola de 10 a la vez') for i in range(10)]))
    with ThreadPoolExecutor(20) as ex:
        list(ex.map(chat, [(sesiones[i % len(sesiones)], PREGUNTAS[i % 8], '4. chat, ola de 20 a la vez') for i in range(20)]))
    # 5) Voz: 12 a la vez (6 resúmenes de respuestas reales + 3 cliente + 3 clienta).
    cuerpos = [{'empresa': 'del-rio', 'texto': respuestas[i % len(respuestas)][:3500]} for i in range(6)]
    cuerpos += [{'empresa': 'del-rio', 'texto': f'Oiga, joven, me cobró dos veces el refresco número {i}.', 'modo': 'literal', 'quien': 'cliente'} for i in range(3)]
    cuerpos += [{'empresa': 'del-rio', 'texto': f'Buenas tardes, traigo el cupón número {i}, ¿me lo aplica?', 'modo': 'literal', 'quien': 'clienta'} for i in range(3)]
    with ThreadPoolExecutor(12) as ex:
        list(ex.map(voz, [(sesiones[i % len(sesiones)], c, '5. voz Azure, 12 a la vez') for i, c in enumerate(cuerpos)]))
    # 6) La misma voz pedida por 10 jueces a la vez («Escúchala» en la misma lección): debe salir del caché.
    igual = {'empresa': 'del-rio', 'texto': 'En esta lección vas a aprender a cobrar con tarjeta y qué hacer si la terminal no responde.', 'modo': 'literal'}
    voz((sesiones[0], igual, '6. misma voz, 10 a la vez (caché)'))
    with ThreadPoolExecutor(10) as ex:
        list(ex.map(voz, [(sesiones[i], igual, '6. misma voz, 10 a la vez (caché)') for i in range(10)]))
    # 7) Micrófono y 8) práctica.
    with ThreadPoolExecutor(6) as ex:
        list(ex.map(transcribir, [(sesiones[i], wav) for i in range(6)]))
    with ThreadPoolExecutor(6) as ex:
        list(ex.map(practica, sesiones[:6]))
    # 9) Después de todo: una pregunta normal sigue funcionando.
    chat((sesiones[0], '¿Cómo aplico una promoción?', '9. chat después del estrés'))
    for s in sesiones[:40]:
        s.pedir('POST', '/auth/salir')

    print(f'Duración total: {time.time() - inicio:.0f} s · sesiones abiertas: {len(sesiones)}\n')
    print(f'{"fase":42} {"ok":>7} {"p50":>6} {"p95":>6} {"máx":>6}')
    for fase in sorted(resultados):
        xs = resultados[fase]
        ts = sorted(t for _, t, _ in xs)
        p95 = ts[min(len(ts) - 1, int(len(ts) * 0.95))]
        print(f'{fase:42} {sum(ok for ok, _, _ in xs):>3}/{len(xs):<3} {statistics.median(ts):6.2f} {p95:6.2f} {ts[-1]:6.2f}')
    print('\nFallos:')
    hubo = False
    for fase in sorted(resultados):
        for ok, t, d in resultados[fase]:
            if not ok:
                hubo = True
                print(f'  {fase}: {d} ({t:.1f} s)')
    print('  ninguno' if not hubo else '')
    print('\nDetalle del chat (ola de 20):')
    for ok, t, d in resultados.get('4. chat, ola de 20 a la vez', []):
        print(f'  {"✅" if ok else "❌"} {t:5.1f} s · {d}')


main()
