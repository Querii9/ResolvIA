// Built-in knowledge base: self-service guides shown to employees and used by the AI to pick a fix.
// Keep them generic (Microsoft 365 / Windows) so any organisation can adapt them.
export const GUIDES = [
  {
    id: "password-change",
    category: "access",
    minutes: 3,
    automation: "reset-password",
    keywords: ["contrasenya", "contrasena", "password", "clau", "canviar contrasenya", "cambiar contrasena", "change password", "oblidat", "olvidado", "forgot", "caducada", "caducado", "expired", "reset", "restablir", "restablecer", "no recordo", "no me acuerdo"],
    title: {
      ca: "Canviar la contrasenya",
      es: "Cambiar la contraseña",
      en: "Change your password",
    },
    summary: {
      ca: "Com canviar la contrasenya del compte de la feina i què fer si l'has oblidada o ha caducat.",
      es: "Cómo cambiar la contraseña de la cuenta del trabajo y qué hacer si la has olvidado o ha caducado.",
      en: "How to change your work account password, and what to do if you've forgotten it or it has expired.",
    },
    body: {
      ca: `Canvia la contrasenya abans que caduqui per no quedar-te sense accés.

### Passos

1. A l'ordinador de la feina, prem **Ctrl + Alt + Supr** i tria **Canvia una contrasenya**.
2. Escriu la contrasenya actual i, després, la nova dues vegades.
3. Fes servir com a mínim 12 caràcters. Una frase fàcil de recordar és una bona opció.
4. No reutilitzis contrasenyes antigues ni les que fas servir fora de la feina.
5. Si treballes des del navegador, fes clic a la teva foto de perfil a Microsoft 365, obre el teu compte i tria **Contrasenya > Canvia la contrasenya**.
6. Si l'has oblidada o ha caducat, restableix-la des de la pantalla d'inici de sessió o des del portal d'autoservei de la teva organització.
7. Després del canvi, torna a iniciar la sessió a l'Outlook, al Teams i al mòbil amb la contrasenya nova.

### Si no funciona

- Si el canvi no s'aplica, connecta't a la xarxa de l'oficina o a la VPN i torna-ho a provar.
- Si no pots verificar la teva identitat, obre un tiquet i el servei d'informàtica et donarà una contrasenya temporal.`,
      es: `Cambia la contraseña antes de que caduque para no quedarte sin acceso.

### Pasos

1. En el ordenador del trabajo, pulsa **Ctrl + Alt + Supr** y elige **Cambiar una contraseña**.
2. Escribe la contraseña actual y, después, la nueva dos veces.
3. Usa al menos 12 caracteres. Una frase fácil de recordar es una buena opción.
4. No reutilices contraseñas antiguas ni las que usas fuera del trabajo.
5. Si trabajas desde el navegador, haz clic en tu foto de perfil en Microsoft 365, abre **Mi cuenta** y elige **Contraseña > Cambiar contraseña**.
6. Si la has olvidado o ha caducado, restablécela desde la pantalla de inicio de sesión o desde el portal de autoservicio de tu organización.
7. Después del cambio, vuelve a iniciar sesión en Outlook, Teams y el móvil con la contraseña nueva.

### Si no funciona

- Si el cambio no se aplica, conéctate a la red de la oficina o a la VPN y vuelve a intentarlo.
- Si no puedes verificar tu identidad, abre un ticket y el servicio de informática te dará una contraseña temporal.`,
      en: `Change your password before it expires so you don't lose access.

### Steps

1. On your work computer, press **Ctrl + Alt + Delete** and choose **Change a password**.
2. Type your current password, then the new one twice.
3. Use at least 12 characters. An easy-to-remember phrase works well.
4. Don't reuse old passwords or ones you use outside work.
5. If you work in the browser, select your profile picture in Microsoft 365, open **View account** and choose **Password > Change password**.
6. If you've forgotten it or it has expired, reset it from the sign-in screen or from your organization's self-service portal.
7. After the change, sign in again to Outlook, Teams and your phone with the new password.

### If it doesn't work

- If the change doesn't apply, connect to the office network or the VPN and try again.
- If you can't verify your identity, open a ticket and the IT service desk will give you a temporary password.`,
    },
  },
  {
    id: "account-locked",
    category: "access",
    minutes: 5,
    automation: "unlock-account",
    keywords: ["bloquejat", "bloqueado", "bloqueada", "locked", "lockout", "compte bloquejat", "cuenta bloqueada", "account locked", "desbloquejar", "desbloquear", "unlock", "intents", "intentos", "attempts", "no puc entrar", "no puedo entrar", "cant sign in"],
    title: {
      ca: "Compte bloquejat per massa intents",
      es: "Cuenta bloqueada por demasiados intentos",
      en: "Account locked after too many attempts",
    },
    summary: {
      ca: "Què fer quan el compte es bloqueja per haver escrit malament la contrasenya massa vegades i com evitar que torni a passar.",
      es: "Qué hacer cuando la cuenta se bloquea por escribir mal la contraseña demasiadas veces y cómo evitar que vuelva a pasar.",
      en: "What to do when your account locks after too many wrong passwords, and how to stop it happening again.",
    },
    body: {
      ca: `El compte es bloqueja uns minuts quan s'escriu malament la contrasenya massa vegades seguides. És una mesura de seguretat.

### Passos

1. No ho tornis a provar de seguida: cada intent fallit pot allargar el bloqueig.
2. Espera entre 15 i 30 minuts i torna a iniciar la sessió amb calma.
3. Comprova que la tecla **Bloq Maj** no estigui activada i que el teclat estigui en l'idioma correcte.
4. Si no recordes la contrasenya, restableix-la des del portal d'autoservei de la teva organització. Normalment això també desbloqueja el compte.
5. Si fa poc que l'has canviada, actualitza-la al mòbil, a la tauleta i a les unitats de xarxa connectades. Sovint són aquests dispositius els que bloquegen el compte amb la contrasenya antiga.
6. Tanca les sessions obertes en altres ordinadors on hagis entrat amb el teu usuari.

### Si no funciona

- Si el compte es torna a bloquejar sense que hagis fet res, pot ser per un dispositiu oblidat o per un intent d'accés sospitós.
- Obre un tiquet perquè el servei d'informàtica el desbloquegi i en revisi l'origen.`,
      es: `La cuenta se bloquea unos minutos cuando se escribe mal la contraseña demasiadas veces seguidas. Es una medida de seguridad.

### Pasos

1. No lo vuelvas a intentar enseguida: cada intento fallido puede alargar el bloqueo.
2. Espera entre 15 y 30 minutos e inicia sesión de nuevo con calma.
3. Comprueba que la tecla **Bloq Mayús** no esté activada y que el teclado esté en el idioma correcto.
4. Si no recuerdas la contraseña, restablécela desde el portal de autoservicio de tu organización. Normalmente eso también desbloquea la cuenta.
5. Si la cambiaste hace poco, actualízala en el móvil, la tableta y las unidades de red conectadas. A menudo son esos dispositivos los que bloquean la cuenta con la contraseña antigua.
6. Cierra las sesiones abiertas en otros ordenadores donde hayas entrado con tu usuario.

### Si no funciona

- Si la cuenta se vuelve a bloquear sin que hayas hecho nada, puede deberse a un dispositivo olvidado o a un intento de acceso sospechoso.
- Abre un ticket para que el servicio de informática la desbloquee y revise el origen.`,
      en: `Your account locks for a few minutes when the password is typed wrongly too many times in a row. It's a security measure.

### Steps

1. Don't try again straight away: each failed attempt can extend the lock.
2. Wait 15 to 30 minutes, then sign in again carefully.
3. Check that **Caps Lock** is off and that your keyboard is set to the right language.
4. If you can't remember your password, reset it from your organization's self-service portal. This usually unlocks the account too.
5. If you changed it recently, update it on your phone, tablet and any mapped network drives. These devices often lock the account by trying the old password.
6. Sign out of any other computers where you're still signed in.

### If it doesn't work

- If the account keeps locking without you doing anything, it may be a forgotten device or a suspicious sign-in attempt.
- Open a ticket so the IT service desk can unlock it and check the cause.`,
    },
  },
  {
    id: "mfa-setup",
    category: "access",
    minutes: 10,
    automation: null,
    keywords: ["mfa", "2fa", "authenticator", "autenticador", "doble factor", "dos passos", "dos pasos", "two factor", "verificacio", "verificacion", "verification", "codi", "codigo", "mobil nou", "movil nuevo", "new phone", "qr"],
    title: {
      ca: "Configurar la verificació en dos passos",
      es: "Configurar la verificación en dos pasos",
      en: "Set up two-step verification",
    },
    summary: {
      ca: "Com configurar l'aplicació Microsoft Authenticator per iniciar la sessió amb seguretat i què fer si canvies de mòbil.",
      es: "Cómo configurar la aplicación Microsoft Authenticator para iniciar sesión de forma segura y qué hacer si cambias de móvil.",
      en: "How to set up the Microsoft Authenticator app to sign in securely, and what to do when you change phones.",
    },
    body: {
      ca: `La verificació en dos passos protegeix el compte encara que algú descobreixi la teva contrasenya.

### Passos

1. Al mòbil, instal·la l'aplicació **Microsoft Authenticator** des de la botiga d'aplicacions oficial.
2. A l'ordinador, fes clic a la teva foto de perfil a Microsoft 365, obre el teu compte i ves a **Informació de seguretat**.
3. Tria **Afegeix un mètode d'inici de sessió** i selecciona **Microsoft Authenticator**.
4. A l'aplicació del mòbil, toca **+**, tria l'opció de compte de la feina i escaneja el codi QR que apareix a la pantalla.
5. Aprova la notificació de prova: escriu al mòbil el número que veus a l'ordinador.
6. Si canvies de mòbil, afegeix el nou com a mètode abans de retornar o formatar l'antic. Després, elimina l'antic de la llista.

### Si no funciona

- Comprova que el mòbil tingui l'hora automàtica activada i que l'aplicació pugui enviar notificacions.
- Si has perdut el mòbil antic i no pots entrar, obre un tiquet perquè el servei d'informàtica restableixi els teus mètodes de verificació.`,
      es: `La verificación en dos pasos protege tu cuenta aunque alguien descubra tu contraseña.

### Pasos

1. En el móvil, instala la aplicación **Microsoft Authenticator** desde la tienda de aplicaciones oficial.
2. En el ordenador, haz clic en tu foto de perfil en Microsoft 365 y abre **Mi cuenta > Información de seguridad**.
3. Elige **Agregar método de inicio de sesión** y selecciona **Microsoft Authenticator**.
4. En la aplicación del móvil, toca **+**, elige la opción de cuenta del trabajo y escanea el código QR que aparece en pantalla.
5. Aprueba la notificación de prueba: escribe en el móvil el número que ves en el ordenador.
6. Si cambias de móvil, añade el nuevo como método antes de devolver o formatear el antiguo. Después, elimina el antiguo de la lista.

### Si no funciona

- Comprueba que el móvil tenga la hora automática activada y que la aplicación pueda enviar notificaciones.
- Si has perdido el móvil antiguo y no puedes entrar, abre un ticket para que el servicio de informática restablezca tus métodos de verificación.`,
      en: `Two-step verification protects your account even if someone finds out your password.

### Steps

1. On your phone, install the **Microsoft Authenticator** app from the official app store.
2. On your computer, select your profile picture in Microsoft 365 and open **View account > Security info**.
3. Choose **Add sign-in method** and select **Microsoft Authenticator**.
4. In the phone app, tap **+**, choose the work account option and scan the QR code shown on screen.
5. Approve the test notification: type on your phone the number you see on your computer.
6. If you change phones, add the new one as a method before returning or resetting the old one. Then remove the old one from the list.

### If it doesn't work

- Check that your phone has automatic time turned on and that the app is allowed to send notifications.
- If you've lost your old phone and can't sign in, open a ticket so the IT service desk can reset your verification methods.`,
    },
  },
  {
    id: "outlook-rules",
    category: "email",
    minutes: 4,
    automation: null,
    keywords: ["regla", "reglas", "rule", "rules", "outlook", "moure correus", "mover correos", "move emails", "carpeta", "folder", "automatic", "automatico", "filtre", "filtro", "filter", "organitzar", "remitent", "remitente"],
    title: {
      ca: "Crear una regla a l'Outlook",
      es: "Crear una regla en Outlook",
      en: "Create a rule in Outlook",
    },
    summary: {
      ca: "Com fer que l'Outlook mogui automàticament a una carpeta els correus d'un remitent o amb un assumpte concret.",
      es: "Cómo hacer que Outlook mueva automáticamente a una carpeta los correos de un remitente o con un asunto concreto.",
      en: "How to make Outlook automatically move emails from a sender or with a certain subject into a folder.",
    },
    body: {
      ca: `Les regles ordenen el correu per tu. Per exemple, poden moure a una carpeta tot el que t'envia un remitent concret.

### Passos

1. Primer, crea la carpeta de destinació si encara no la tens.
2. A l'Outlook nou o al web, obre **Configuració > Correu > Regles** i fes clic a **Afegeix una regla nova**.
3. Posa un nom a la regla.
4. A **Afegeix una condició**, tria per exemple **De** i escriu l'adreça del remitent, o bé **L'assumpte inclou** i una paraula.
5. A **Afegeix una acció**, tria **Mou a** i selecciona la carpeta.
6. Marca **Executa la regla ara** si també la vols aplicar als correus que ja tens i fes clic a **Desa**.
7. A l'Outlook clàssic, ves a **Fitxer > Administra les regles i les alertes > Regla nova** i segueix l'assistent amb les mateixes condicions.

### Si no funciona

- Comprova que la regla estigui activada i que cap altra regla no mogui abans el mateix correu.
- Si les regles deixen de funcionar o no les pots desar, obre un tiquet.`,
      es: `Las reglas ordenan el correo por ti. Por ejemplo, pueden mover a una carpeta todo lo que te envía un remitente concreto.

### Pasos

1. Primero, crea la carpeta de destino si todavía no la tienes.
2. En el Outlook nuevo o en la web, abre **Configuración > Correo > Reglas** y haz clic en **Agregar nueva regla**.
3. Ponle un nombre a la regla.
4. En **Agregar una condición**, elige por ejemplo **De** y escribe la dirección del remitente, o bien **El asunto incluye** y una palabra.
5. En **Agregar una acción**, elige **Mover a** y selecciona la carpeta.
6. Marca **Ejecutar la regla ahora** si también quieres aplicarla a los correos que ya tienes y haz clic en **Guardar**.
7. En el Outlook clásico, ve a **Archivo > Administrar reglas y alertas > Nueva regla** y sigue el asistente con las mismas condiciones.

### Si no funciona

- Comprueba que la regla esté activada y que ninguna otra regla mueva antes el mismo correo.
- Si las reglas dejan de funcionar o no puedes guardarlas, abre un ticket.`,
      en: `Rules sort your email for you. For example, they can move everything from a specific sender into a folder.

### Steps

1. First, create the destination folder if you don't have it yet.
2. In new Outlook or on the web, open **Settings > Mail > Rules** and select **Add new rule**.
3. Give the rule a name.
4. Under **Add a condition**, choose for example **From** and type the sender's address, or **Subject includes** and a word.
5. Under **Add an action**, choose **Move to** and pick the folder.
6. Check **Run rule now** if you also want to apply it to emails you already have, then select **Save**.
7. In classic Outlook, go to **File > Manage Rules & Alerts > New Rule** and follow the wizard with the same conditions.

### If it doesn't work

- Check that the rule is turned on and that no other rule moves the same email first.
- If rules stop working or you can't save them, open a ticket.`,
    },
  },
  {
    id: "outlook-out-of-office",
    category: "email",
    minutes: 3,
    automation: null,
    keywords: ["vacances", "vacaciones", "holiday", "vacation", "fora oficina", "fuera de la oficina", "out of office", "ooo", "resposta automatica", "respuesta automatica", "automatic reply", "auto reply", "absencia", "ausencia", "absence", "outlook", "permis", "baixa"],
    title: {
      ca: "Activar la resposta automàtica de vacances",
      es: "Activar la respuesta automática de vacaciones",
      en: "Turn on your out-of-office reply",
    },
    summary: {
      ca: "Com configurar a l'Outlook un missatge automàtic mentre ets fora, amb dates i textos diferents per a dins i fora de l'organització.",
      es: "Cómo configurar en Outlook un mensaje automático mientras estás fuera, con fechas y textos distintos para dentro y fuera de la organización.",
      en: "How to set up an automatic Outlook message while you're away, with dates and different texts for inside and outside your organization.",
    },
    body: {
      ca: `La resposta automàtica avisa qui t'escriu que no hi ets i a qui s'ha d'adreçar mentrestant.

### Passos

1. A l'Outlook nou o al web, obre **Configuració > Comptes > Respostes automàtiques**.
2. Activa l'opció **Activa les respostes automàtiques**.
3. Marca **Envia respostes només durant un període de temps** i indica la data i l'hora d'inici i de final.
4. Escriu el missatge per als companys: fins quan estaràs fora i qui et substitueix.
5. Marca **Envia respostes fora de l'organització** i escriu un text més breu per a clients i proveïdors, sense detalls interns.
6. Fes clic a **Desa**.
7. A l'Outlook clàssic, ves a **Fitxer > Respostes automàtiques** i omple les pestanyes **Dins de la meva organització** i **Fora de la meva organització**.

### Si no funciona

- Demana a un company que t'enviï un correu per comprovar que la resposta arriba.
- Si no veus l'opció o els canvis no es desen, obre un tiquet.`,
      es: `La respuesta automática avisa a quien te escribe de que no estás y de a quién debe dirigirse mientras tanto.

### Pasos

1. En el Outlook nuevo o en la web, abre **Configuración > Cuentas > Respuestas automáticas**.
2. Activa la opción **Activar respuestas automáticas**.
3. Marca **Enviar respuestas solo durante un período de tiempo** e indica la fecha y la hora de inicio y de fin.
4. Escribe el mensaje para los compañeros: hasta cuándo estarás fuera y quién te sustituye.
5. Marca **Enviar respuestas fuera de la organización** y escribe un texto más breve para clientes y proveedores, sin detalles internos.
6. Haz clic en **Guardar**.
7. En el Outlook clásico, ve a **Archivo > Respuestas automáticas** y rellena las pestañas **Dentro de mi organización** y **Fuera de mi organización**.

### Si no funciona

- Pide a un compañero que te envíe un correo para comprobar que la respuesta llega.
- Si no ves la opción o los cambios no se guardan, abre un ticket.`,
      en: `An automatic reply tells people who email you that you're away and who to contact in the meantime.

### Steps

1. In new Outlook or on the web, open **Settings > Accounts > Automatic replies**.
2. Switch on **Turn on automatic replies**.
3. Select **Send replies only during a time period** and set the start and end date and time.
4. Write the message for colleagues: when you'll be back and who is covering for you.
5. Select **Send replies outside your organization** and write a shorter text for customers and suppliers, without internal details.
6. Select **Save**.
7. In classic Outlook, go to **File > Automatic Replies** and fill in the **Inside My Organization** and **Outside My Organization** tabs.

### If it doesn't work

- Ask a colleague to send you an email to check that the reply arrives.
- If you can't see the option or the changes won't save, open a ticket.`,
    },
  },
  {
    id: "mailbox-full",
    category: "email",
    minutes: 10,
    automation: "archive-mailbox",
    keywords: ["bustia plena", "buzon lleno", "mailbox full", "quota", "cuota", "espai", "espacio", "storage", "arxivar", "archivar", "archive", "adjunts", "adjuntos", "attachments", "eliminats", "eliminados", "no puc enviar", "no puedo enviar"],
    title: {
      ca: "Alliberar espai quan la bústia és plena",
      es: "Liberar espacio cuando el buzón está lleno",
      en: "Free up space when your mailbox is full",
    },
    summary: {
      ca: "Com alliberar espai a l'Outlook buidant els elements suprimits, arxivant correus antics i esborrant adjunts grans.",
      es: "Cómo liberar espacio en Outlook vaciando los elementos eliminados, archivando correos antiguos y borrando adjuntos grandes.",
      en: "How to free up space in Outlook by emptying deleted items, archiving old emails and removing large attachments.",
    },
    body: {
      ca: `Quan la bústia és plena, pots deixar de rebre o d'enviar correus. Segueix aquests passos per alliberar espai.

### Passos

1. Comprova quant espai fas servir: a l'Outlook nou, obre **Configuració** i busca **Emmagatzematge**; a l'Outlook clàssic, ves a **Fitxer > Informació**.
2. Buida **Elements suprimits**: fes-hi clic amb el botó dret i tria **Buida la carpeta**.
3. Fes el mateix amb **Correu brossa** i revisa **Elements enviats**, que sovint ocupa molt.
4. Localitza els correus més grans: filtra per **Té fitxers adjunts** i ordena la llista per mida.
5. Desa a OneDrive els adjunts que necessitis i esborra els correus que ja no et calen.
6. Si a la llista de carpetes tens **Arxiu en línia**, arrossega-hi els correus antics. Allà no ocupen espai de la bústia principal.

### Si no funciona

- Després de netejar, l'espai pot trigar unes hores a actualitzar-se.
- Si continues sense espai, obre un tiquet per demanar l'arxiu en línia o més capacitat.`,
      es: `Cuando el buzón está lleno, puedes dejar de recibir o enviar correos. Sigue estos pasos para liberar espacio.

### Pasos

1. Comprueba cuánto espacio usas: en el Outlook nuevo, abre **Configuración** y busca **Almacenamiento**; en el Outlook clásico, ve a **Archivo > Información**.
2. Vacía **Elementos eliminados**: haz clic con el botón derecho en la carpeta y elige **Vaciar carpeta**.
3. Haz lo mismo con **Correo no deseado** y revisa **Elementos enviados**, que a menudo ocupa mucho.
4. Localiza los correos más grandes: filtra por **Tiene datos adjuntos** y ordena la lista por tamaño.
5. Guarda en OneDrive los adjuntos que necesites y borra los correos que ya no te hagan falta.
6. Si en la lista de carpetas tienes **Archivo en línea**, arrastra allí los correos antiguos. Ahí no ocupan espacio del buzón principal.

### Si no funciona

- Después de limpiar, el espacio puede tardar unas horas en actualizarse.
- Si sigues sin espacio, abre un ticket para pedir el archivo en línea o más capacidad.`,
      en: `When your mailbox is full, you may stop receiving or sending emails. Follow these steps to free up space.

### Steps

1. Check how much space you're using: in new Outlook, open **Settings** and look for **Storage**; in classic Outlook, go to **File > Info**.
2. Empty **Deleted Items**: right-click the folder and choose **Empty folder**.
3. Do the same with **Junk Email** and review **Sent Items**, which often takes up a lot of space.
4. Find the largest emails: filter by **Has attachments** and sort the list by size.
5. Save the attachments you need to OneDrive and delete the emails you no longer need.
6. If you see **Online Archive** in your folder list, drag old emails into it. Emails there don't count towards your main mailbox.

### If it doesn't work

- After cleaning up, the space can take a few hours to update.
- If you're still out of space, open a ticket to request an online archive or more capacity.`,
    },
  },
  {
    id: "shared-mailbox",
    category: "email",
    minutes: 5,
    automation: "grant-mailbox-access",
    keywords: ["bustia compartida", "buzon compartido", "shared mailbox", "compartida", "compartido", "shared", "permisos", "permissions", "enviar com", "enviar como", "send as", "bustia departament", "buzon del departamento", "team mailbox", "correu generic", "correo generico", "outlook"],
    title: {
      ca: "Accedir a una bústia compartida",
      es: "Acceder a un buzón compartido",
      en: "Open a shared mailbox",
    },
    summary: {
      ca: "Com obrir a l'Outlook una bústia compartida, com ara la d'un departament, un cop t'hi han donat accés.",
      es: "Cómo abrir en Outlook un buzón compartido, como el de un departamento, una vez que te han dado acceso.",
      en: "How to open a shared mailbox, such as a department one, in Outlook once you've been given access.",
    },
    body: {
      ca: `Una bústia compartida és una adreça que fan servir diverses persones, com la d'un departament. Per obrir-la, primer cal que t'hi hagin donat accés.

### Passos

1. Quan ja tinguis els permisos, espera fins a una hora i reinicia l'Outlook.
2. A l'Outlook clàssic, sovint apareix sola a la llista de carpetes, sota la teva bústia.
3. A l'Outlook nou o al web, fes clic amb el botó dret a **Compartit amb mi** (o a **Carpetes**) i tria **Afegeix una carpeta o bústia compartida**.
4. Escriu el nom o l'adreça de la bústia i fes clic a **Afegeix**.
5. Per enviar des de la bústia, si tens permís, crea un missatge nou, activa **De** a la pestanya **Opcions** i tria l'adreça compartida.
6. Si hi entres sovint, afegeix-ne les carpetes principals a **Preferits**.

### Si no funciona

- Si surt un error de permisos, és possible que encara no s'hagin aplicat: espera una estona i torna-ho a provar.
- Si al cap d'unes hores continues sense accés, obre un tiquet indicant el nom de la bústia.`,
      es: `Un buzón compartido es una dirección que usan varias personas, como la de un departamento. Para abrirlo, primero te tienen que haber dado acceso.

### Pasos

1. Cuando ya tengas los permisos, espera hasta una hora y reinicia Outlook.
2. En el Outlook clásico, a menudo aparece solo en la lista de carpetas, debajo de tu buzón.
3. En el Outlook nuevo o en la web, haz clic con el botón derecho en **Compartido conmigo** (o en **Carpetas**) y elige **Agregar carpeta o buzón compartido**.
4. Escribe el nombre o la dirección del buzón y haz clic en **Agregar**.
5. Para enviar desde el buzón, si tienes permiso, crea un mensaje nuevo, activa **De** en la pestaña **Opciones** y elige la dirección compartida.
6. Si lo usas a menudo, añade sus carpetas principales a **Favoritos**.

### Si no funciona

- Si aparece un error de permisos, puede que todavía no se hayan aplicado: espera un rato y vuelve a intentarlo.
- Si pasadas unas horas sigues sin acceso, abre un ticket indicando el nombre del buzón.`,
      en: `A shared mailbox is an address used by several people, such as a department inbox. To open it, you first need to have been given access.

### Steps

1. Once you have the permissions, wait up to an hour and restart Outlook.
2. In classic Outlook, it often appears on its own in the folder list, below your mailbox.
3. In new Outlook or on the web, right-click **Shared with me** (or **Folders**) and choose **Add shared folder or mailbox**.
4. Type the name or address of the mailbox and select **Add**.
5. To send from the mailbox, if you're allowed to, create a new message, turn on **From** on the **Options** tab and pick the shared address.
6. If you use it often, add its main folders to **Favorites**.

### If it doesn't work

- If you get a permissions error, they may not have been applied yet: wait a while and try again.
- If you still have no access after a few hours, open a ticket with the name of the mailbox.`,
    },
  },
  {
    id: "vpn-connect",
    category: "network",
    minutes: 5,
    automation: null,
    keywords: ["vpn", "casa", "desde casa", "working from home", "teletreball", "teletrabajo", "remot", "remoto", "remote", "connectar", "conectar", "connect", "xarxa", "wifi", "no connecta", "no conecta", "desconnecta", "unitat de xarxa"],
    title: {
      ca: "Connectar-se a la VPN des de casa",
      es: "Conectarse a la VPN desde casa",
      en: "Connect to the VPN from home",
    },
    summary: {
      ca: "Com connectar-te a la VPN de l'organització per treballar a distància i com solucionar els errors més habituals.",
      es: "Cómo conectarte a la VPN de la organización para teletrabajar y cómo solucionar los errores más habituales.",
      en: "How to connect to your organization's VPN when working remotely, and how to fix the most common errors.",
    },
    body: {
      ca: `La VPN et permet accedir de manera segura a les carpetes i aplicacions internes quan no ets a l'oficina.

### Passos

1. Comprova que tens connexió a internet: obre qualsevol pàgina web.
2. Obre l'aplicació de VPN de la teva organització des del menú **Inici** o des de la icona del costat del rellotge. Si la teva organització fa servir la VPN de Windows, ves a **Configuració > Xarxa i Internet > VPN**.
3. Tria la connexió i fes clic a **Connecta**.
4. Inicia la sessió amb el teu usuari de la feina i aprova la verificació al mòbil.
5. Espera que l'estat indiqui **Connectat** abans d'obrir les carpetes o aplicacions internes.
6. Si falla, desconnecta, reinicia l'ordinador i torna-ho a provar.
7. Si la connexió de casa és lenta o inestable, acosta't al router o fes servir un cable de xarxa. Algunes xarxes públiques, com les dels hotels, bloquegen la VPN.

### Si no funciona

- Anota el missatge d'error exacte i l'hora en què ha passat.
- Obre un tiquet amb aquesta informació. Si no pots accedir al portal, fes-ho des del mòbil.`,
      es: `La VPN te permite acceder de forma segura a las carpetas y aplicaciones internas cuando no estás en la oficina.

### Pasos

1. Comprueba que tienes conexión a internet: abre cualquier página web.
2. Abre la aplicación de VPN de tu organización desde el menú **Inicio** o desde el icono junto al reloj. Si tu organización usa la VPN de Windows, ve a **Configuración > Red e Internet > VPN**.
3. Elige la conexión y haz clic en **Conectar**.
4. Inicia sesión con tu usuario del trabajo y aprueba la verificación en el móvil.
5. Espera a que el estado indique **Conectado** antes de abrir las carpetas o aplicaciones internas.
6. Si falla, desconecta, reinicia el ordenador y vuelve a intentarlo.
7. Si la conexión de casa es lenta o inestable, acércate al router o usa un cable de red. Algunas redes públicas, como las de los hoteles, bloquean la VPN.

### Si no funciona

- Apunta el mensaje de error exacto y la hora en que ha ocurrido.
- Abre un ticket con esa información. Si no puedes acceder al portal, hazlo desde el móvil.`,
      en: `The VPN lets you securely reach internal folders and applications when you're not in the office.

### Steps

1. Check that you're online: open any website.
2. Open your organization's VPN app from the **Start** menu or from the icon next to the clock. If your organization uses the Windows VPN, go to **Settings > Network & internet > VPN**.
3. Choose the connection and select **Connect**.
4. Sign in with your work account and approve the verification on your phone.
5. Wait until the status shows **Connected** before opening internal folders or applications.
6. If it fails, disconnect, restart your computer and try again.
7. If your home connection is slow or unstable, move closer to the router or use a network cable. Some public networks, such as hotel ones, block VPNs.

### If it doesn't work

- Write down the exact error message and when it happened.
- Open a ticket with that information. If you can't reach the portal, use your phone.`,
    },
  },
  {
    id: "printer-add",
    category: "printing",
    minutes: 5,
    automation: "clear-print-queue",
    keywords: ["impressora", "impresora", "printer", "imprimir", "print", "cua impressio", "cola de impresion", "print queue", "encallat", "atascado", "stuck", "no imprimeix", "no imprime", "afegir impressora", "anadir impresora", "add printer", "paper", "toner"],
    title: {
      ca: "Afegir una impressora i desencallar la cua",
      es: "Añadir una impresora y desatascar la cola",
      en: "Add a printer and clear the print queue",
    },
    summary: {
      ca: "Com afegir una impressora de xarxa al Windows 11 i què fer quan els documents es queden encallats a la cua d'impressió.",
      es: "Cómo añadir una impresora de red en Windows 11 y qué hacer cuando los documentos se quedan atascados en la cola de impresión.",
      en: "How to add a network printer in Windows 11 and what to do when documents get stuck in the print queue.",
    },
    body: {
      ca: `Pots afegir tu mateix les impressores de la xarxa de l'oficina des de la configuració del Windows.

### Passos

1. Connecta't a la xarxa de l'oficina o a la VPN.
2. Obre **Configuració > Bluetooth i dispositius > Impressores i escàners** i fes clic a **Afegeix un dispositiu**.
3. Espera que aparegui la llista i tria la impressora. Normalment el nom és a l'etiqueta de l'aparell.
4. Si no hi apareix, fes clic a **Afegeix manualment**, tria **Selecciona una impressora compartida per nom** i escriu el nom que t'hagi donat el servei d'informàtica.
5. Imprimeix una pàgina de prova.
6. Si un document es queda encallat, obre la impressora a la mateixa pantalla, fes clic a **Obre la cua d'impressió** i cancel·la tots els documents.
7. Apaga i torna a encendre la impressora i reinicia l'ordinador.

### Si no funciona

- Comprova que la impressora tingui paper i tòner i que no mostri cap error a la pantalla.
- Si la cua es torna a encallar o la impressora no apareix, obre un tiquet amb el nom de la impressora.`,
      es: `Puedes añadir tú mismo las impresoras de la red de la oficina desde la configuración de Windows.

### Pasos

1. Conéctate a la red de la oficina o a la VPN.
2. Abre **Configuración > Bluetooth y dispositivos > Impresoras y escáneres** y haz clic en **Agregar dispositivo**.
3. Espera a que aparezca la lista y elige la impresora. Normalmente el nombre está en la etiqueta del aparato.
4. Si no aparece, haz clic en **Agregar manualmente**, elige **Seleccionar una impresora compartida por nombre** y escribe el nombre que te haya dado el servicio de informática.
5. Imprime una página de prueba.
6. Si un documento se queda atascado, abre la impresora en la misma pantalla, haz clic en **Abrir cola de impresión** y cancela todos los documentos.
7. Apaga y vuelve a encender la impresora y reinicia el ordenador.

### Si no funciona

- Comprueba que la impresora tenga papel y tóner y que no muestre ningún error en la pantalla.
- Si la cola se vuelve a atascar o la impresora no aparece, abre un ticket con el nombre de la impresora.`,
      en: `You can add office network printers yourself from Windows settings.

### Steps

1. Connect to the office network or the VPN.
2. Open **Settings > Bluetooth & devices > Printers & scanners** and select **Add device**.
3. Wait for the list to appear and choose the printer. The name is usually on a label on the device.
4. If it isn't listed, select **Add manually**, choose **Select a shared printer by name** and type the name the IT service desk gave you.
5. Print a test page.
6. If a document gets stuck, open the printer on the same screen, select **Open print queue** and cancel all documents.
7. Turn the printer off and on again, and restart your computer.

### If it doesn't work

- Check that the printer has paper and toner and isn't showing an error on its screen.
- If the queue gets stuck again or the printer doesn't appear, open a ticket with the printer's name.`,
    },
  },
  {
    id: "excel-basics",
    category: "office",
    minutes: 10,
    automation: null,
    keywords: ["excel", "fixar files", "inmovilizar", "immobilitzar", "freeze", "buscarx", "xlookup", "buscarv", "vlookup", "formula", "protegir full", "proteger hoja", "protect sheet", "full de calcul", "hoja de calculo", "spreadsheet", "columna", "column"],
    title: {
      ca: "Excel: fixar files, BUSCARX i protegir un full",
      es: "Excel: inmovilizar filas, BUSCARX y proteger una hoja",
      en: "Excel: freeze rows, XLOOKUP and protect a sheet",
    },
    summary: {
      ca: "Tres trucs útils de l'Excel: mantenir visibles els títols, buscar dades en una altra taula i evitar canvis en un full.",
      es: "Tres trucos útiles de Excel: mantener visibles los títulos, buscar datos en otra tabla y evitar cambios en una hoja.",
      en: "Three handy Excel tips: keep headings visible, look up data in another table and stop changes to a sheet.",
    },
    body: {
      ca: `Tres trucs per resoldre els dubtes més habituals amb l'Excel.

### Passos

1. **Fixar files o columnes:** ves a **Visualització > Immobilitza** i tria **Immobilitza la fila superior** o **Immobilitza la primera columna**.
2. Per fixar files i columnes alhora, selecciona la cel·la just a sota i a la dreta del que vols fixar (per exemple, B2) i tria **Immobilitza els panells**.
3. **Buscar dades en una altra taula:** fes servir BUSCARX (XLOOKUP si tens l'Excel en anglès). Per exemple: \`=BUSCARX(A2;Productes!A:A;Productes!C:C;"No trobat")\`.
4. La fórmula busca A2 a la columna A del full Productes i retorna el valor corresponent de la columna C.
5. **Protegir un full:** primer selecciona les cel·les que sí que s'han de poder editar, obre **Format de les cel·les > Protecció** i desmarca **Bloquejada**.
6. Després ves a **Revisió > Protegeix el full**, posa-hi una contrasenya si cal i fes clic a **D'acord**.

### Si no funciona

- Si surt «No trobat» però el valor sí que hi és, comprova que tingui el mateix format (text o número) a totes dues taules.
- Si necessites ajuda amb un fitxer concret, obre un tiquet.`,
      es: `Tres trucos para resolver las dudas más habituales con Excel.

### Pasos

1. **Inmovilizar filas o columnas:** ve a **Vista > Inmovilizar** y elige **Inmovilizar fila superior** o **Inmovilizar primera columna**.
2. Para fijar filas y columnas a la vez, selecciona la celda justo debajo y a la derecha de lo que quieres fijar (por ejemplo, B2) y elige **Inmovilizar paneles**.
3. **Buscar datos en otra tabla:** usa BUSCARX (XLOOKUP si tienes Excel en inglés). Por ejemplo: \`=BUSCARX(A2;Productos!A:A;Productos!C:C;"No encontrado")\`.
4. La fórmula busca A2 en la columna A de la hoja Productos y devuelve el valor correspondiente de la columna C.
5. **Proteger una hoja:** primero selecciona las celdas que sí se deben poder editar, abre **Formato de celdas > Proteger** y desmarca **Bloqueada**.
6. Después ve a **Revisar > Proteger hoja**, pon una contraseña si hace falta y haz clic en **Aceptar**.

### Si no funciona

- Si aparece «No encontrado» pero el valor sí está, comprueba que tenga el mismo formato (texto o número) en las dos tablas.
- Si necesitas ayuda con un archivo concreto, abre un ticket.`,
      en: `Three tips for the most common Excel questions.

### Steps

1. **Freeze rows or columns:** go to **View > Freeze Panes** and choose **Freeze Top Row** or **Freeze First Column**.
2. To freeze rows and columns together, select the cell just below and to the right of what you want to keep visible (for example, B2) and choose **Freeze Panes**.
3. **Look up data in another table:** use XLOOKUP (BUSCARX if your Excel is in Spanish). For example: \`=XLOOKUP(A2,Products!A:A,Products!C:C,"Not found")\`.
4. The formula finds A2 in column A of the Products sheet and returns the matching value from column C.
5. **Protect a sheet:** first select the cells people should still be able to edit, open **Format Cells > Protection** and clear **Locked**.
6. Then go to **Review > Protect Sheet**, add a password if needed and select **OK**.

### If it doesn't work

- If you get "Not found" but the value is there, check that it has the same format (text or number) in both tables.
- If you need help with a specific file, open a ticket.`,
    },
  },
  {
    id: "teams-audio-screen",
    category: "software",
    minutes: 5,
    automation: null,
    keywords: ["teams", "microfon", "microfono", "microphone", "audio", "sonido", "sound", "altaveu", "camera", "camara", "webcam", "no em senten", "no me oyen", "cant hear", "compartir pantalla", "share screen", "auriculars", "headset"],
    title: {
      ca: "Teams: àudio, càmera i compartir pantalla",
      es: "Teams: audio, cámara y compartir pantalla",
      en: "Teams: audio, camera and screen sharing",
    },
    summary: {
      ca: "Què cal revisar quan al Teams no et senten, no sents els altres, la càmera no funciona o no pots compartir la pantalla.",
      es: "Qué revisar cuando en Teams no te oyen, no oyes a los demás, la cámara no funciona o no puedes compartir la pantalla.",
      en: "What to check when people can't hear you in Teams, you can't hear them, your camera doesn't work or you can't share your screen.",
    },
    body: {
      ca: `La majoria de problemes d'àudio i vídeo al Teams es resolen triant el dispositiu correcte.

### Passos

1. Abans d'entrar a la reunió, comprova que el micròfon i la càmera estiguin activats a la pantalla prèvia.
2. Dins de la reunió, obre **Més > Configuració > Configuració del dispositiu** i tria els auriculars, el micròfon i la càmera que fas servir.
3. Per provar-ho, ves a **Configuració > Dispositius** i fes clic a **Fes una trucada de prova**.
4. Comprova que els auriculars estiguin ben connectats i no silenciats.
5. Al Windows, obre **Configuració > Privadesa i seguretat > Micròfon** (i **Càmera**) i comprova que les aplicacions hi tinguin accés.
6. Tanca les altres aplicacions que facin servir la càmera.
7. Per compartir la pantalla, fes clic a **Comparteix** a la barra de la reunió i tria la pantalla o la finestra. Si els altres la veuen en negre, comparteix la pantalla sencera.

### Si no funciona

- Tanca el Teams del tot i reinicia l'ordinador.
- Si continua fallant, obre un tiquet indicant quins auriculars o quina càmera fas servir.`,
      es: `La mayoría de los problemas de audio y vídeo en Teams se resuelven eligiendo el dispositivo correcto.

### Pasos

1. Antes de entrar en la reunión, comprueba que el micrófono y la cámara estén activados en la pantalla previa.
2. Dentro de la reunión, abre **Más > Configuración > Configuración del dispositivo** y elige los auriculares, el micrófono y la cámara que usas.
3. Para probarlo, ve a **Configuración > Dispositivos** y haz clic en **Hacer una llamada de prueba**.
4. Comprueba que los auriculares estén bien conectados y no silenciados.
5. En Windows, abre **Configuración > Privacidad y seguridad > Micrófono** (y **Cámara**) y comprueba que las aplicaciones tengan acceso.
6. Cierra las demás aplicaciones que usen la cámara.
7. Para compartir la pantalla, haz clic en **Compartir** en la barra de la reunión y elige la pantalla o la ventana. Si los demás la ven en negro, comparte la pantalla completa.

### Si no funciona

- Cierra Teams por completo y reinicia el ordenador.
- Si sigue fallando, abre un ticket indicando qué auriculares o qué cámara usas.`,
      en: `Most audio and video problems in Teams are fixed by choosing the right device.

### Steps

1. Before joining the meeting, check that your microphone and camera are turned on in the preview screen.
2. During the meeting, open **More > Settings > Device settings** and choose the headset, microphone and camera you're using.
3. To test them, go to **Settings > Devices** and select **Make a test call**.
4. Check that your headset is properly connected and not muted.
5. In Windows, open **Settings > Privacy & security > Microphone** (and **Camera**) and check that apps are allowed access.
6. Close any other apps using the camera.
7. To share your screen, select **Share** in the meeting toolbar and choose a screen or window. If others see a black screen, share your whole screen instead.

### If it doesn't work

- Quit Teams completely and restart your computer.
- If it still fails, open a ticket and mention which headset or camera you're using.`,
    },
  },
  {
    id: "onedrive-restore",
    category: "office",
    minutes: 4,
    automation: null,
    keywords: ["onedrive", "sharepoint", "recuperar", "restaurar", "restore", "recover", "esborrat", "borrado", "deleted", "paperera", "papelera", "recycle bin", "versio anterior", "version anterior", "previous version", "historial", "fitxer perdut", "archivo perdido"],
    title: {
      ca: "Recuperar un fitxer a OneDrive o SharePoint",
      es: "Recuperar un archivo en OneDrive o SharePoint",
      en: "Recover a file in OneDrive or SharePoint",
    },
    summary: {
      ca: "Com recuperar un fitxer esborrat des de la paperera o tornar a una versió anterior d'un document.",
      es: "Cómo recuperar un archivo borrado desde la papelera o volver a una versión anterior de un documento.",
      en: "How to recover a deleted file from the recycle bin or go back to an earlier version of a document.",
    },
    body: {
      ca: `Els fitxers que esborres a OneDrive i SharePoint es guarden a la paperera, normalment fins a 93 dies.

### Passos

1. Obre OneDrive al navegador des del menú d'aplicacions de Microsoft 365.
2. Al panell de l'esquerra, fes clic a **Paperera de reciclatge**.
3. Selecciona el fitxer i fes clic a **Restaura**. Tornarà a la carpeta on era.
4. Si no el trobes, fes clic a **Paperera de reciclatge de segona fase**, a la part inferior de la pàgina.
5. Si era en un lloc de SharePoint o del Teams, busca'l a la **Paperera de reciclatge** d'aquell lloc.
6. Per recuperar una versió anterior, selecciona el fitxer, obre el menú **...** i tria **Historial de versions**.
7. Revisa la versió que necessites i tria **Restaura**. La versió actual no es perd: queda a l'historial.

### Si no funciona

- Si el fitxer era en una carpeta que una altra persona havia compartit amb tu, demana-li que el busqui a la seva paperera.
- Si han passat més de 93 dies o no trobes el fitxer, obre un tiquet amb el nom, la ubicació i la data aproximada.`,
      es: `Los archivos que borras en OneDrive y SharePoint se guardan en la papelera, normalmente hasta 93 días.

### Pasos

1. Abre OneDrive en el navegador desde el menú de aplicaciones de Microsoft 365.
2. En el panel de la izquierda, haz clic en **Papelera de reciclaje**.
3. Selecciona el archivo y haz clic en **Restaurar**. Volverá a la carpeta donde estaba.
4. Si no lo encuentras, haz clic en **Papelera de reciclaje de segunda fase**, en la parte inferior de la página.
5. Si estaba en un sitio de SharePoint o de Teams, búscalo en la **Papelera de reciclaje** de ese sitio.
6. Para recuperar una versión anterior, selecciona el archivo, abre el menú **...** y elige **Historial de versiones**.
7. Revisa la versión que necesitas y elige **Restaurar**. La versión actual no se pierde: queda en el historial.

### Si no funciona

- Si el archivo estaba en una carpeta que otra persona había compartido contigo, pídele que lo busque en su papelera.
- Si han pasado más de 93 días o no encuentras el archivo, abre un ticket con el nombre, la ubicación y la fecha aproximada.`,
      en: `Files you delete in OneDrive and SharePoint go to the recycle bin, where they're usually kept for up to 93 days.

### Steps

1. Open OneDrive in your browser from the Microsoft 365 app launcher.
2. In the left pane, select **Recycle bin**.
3. Select the file and choose **Restore**. It goes back to the folder it was in.
4. If you can't find it, select **Second-stage recycle bin** at the bottom of the page.
5. If it was in a SharePoint or Teams site, look in that site's **Recycle bin**.
6. To get back an earlier version, select the file, open the **...** menu and choose **Version history**.
7. Review the version you need and choose **Restore**. The current version isn't lost: it stays in the history.

### If it doesn't work

- If the file was in a folder someone else had shared with you, ask them to check their recycle bin.
- If it's been more than 93 days or you can't find the file, open a ticket with its name, location and approximate date.`,
    },
  },
];
