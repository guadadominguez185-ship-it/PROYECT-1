<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Juego TICs Interactivo</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #eef2ff, #ffffff);
      color: #333;
    }
    header, footer {
      padding: 1rem;
      background: #4f46e5;
      color: white;
      text-align: center;
    }
    main {
      max-width: 800px;
      margin: 2rem auto;
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    h1, h2, h3 {
      color: #4f46e5;
    }
    button {
      display: block;
      margin: 0.5rem 0;
      padding: 0.7rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid #ccc;
      cursor: pointer;
      background: #f9f9f9;
    }
    button:hover {
      background: #e0e7ff;
    }
    .selected {
      background: #c7d2fe !important;
      border-color: #4f46e5;
    }
    .badge {
      display: inline-block;
      padding: 0.3rem 0.6rem;
      border: 1px solid #4f46e5;
      border-radius: 1rem;
      margin: 0.2rem;
      background: #eef2ff;
      font-size: 0.8rem;
    }
    .leaderboard {
      margin-top: 1rem;
      font-size: 0.9rem;
    }
    .question {
      margin: 1rem 0;
      padding: 1rem;
      background: #f3f4f6;
      border-radius: 0.5rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.5rem;
    }
    img.icon {
      width: 24px;
      height: 24px;
      vertical-align: middle;
      margin-right: 0.4rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>🎮 Juego Interactivo sobre TICs</h1>
    <p>Educación y Sociedad — Nivel Secundaria</p>
  </header>
  <main>
    <div id="game"></div>
  </main>
  <footer>
    <p>Material educativo: TICs en la educación y la sociedad • Versión 1.1</p>
  </footer>

  <script>
    const gameEl = document.getElementById('game');

    let player = { name: '', score: 0, badges: [] };
    let screen = 'home';
    let leaderboard = JSON.parse(localStorage.getItem('tic_leaderboard')||'[]');
    let quizIndex = 0;
    let timeLeft = 30;
    let interval;
    let matchPairs;
    let selected = [];

    const quizzes = [
      {q: '¿Cuál es una ventaja del uso de TIC en el aula?', options: ['Aumenta la desigualdad educativa','Facilita el aprendizaje colaborativo','Evita la interacción entre estudiantes','Hace innecesaria la planificación docente'], a:1, points:10},
      {q: '¿Qué significa CI en un contexto tecnológico educativo?', options: ['Curriculum Interactivo','Conectividad Inteligente','Competencias Informáticas','Contenido Inmediato'], a:2, points:10},
      {q: '¿Qué riesgo social vinculado a TIC debemos enseñar a gestionar?', options:['Privacidad de datos','Mayor acceso a información','Mejor comunicación','Menos tareas'], a:0, points:10},
      {q: '¿Qué herramienta TIC permite clases en tiempo real?', options:['Plataforma de videoconferencia','Correo electrónico','Blog educativo','Foro tradicional'], a:0, points:10},
      {q: '¿Qué ventaja social generan las TIC en comunidades rurales?', options:['Aíslan a los estudiantes','Facilitan acceso a educación a distancia','Eliminan la lectura','Generan más tareas'], a:1, points:10}
    ];

    const scenarios = [
      { text: 'Tu grupo quiere compartir datos personales de compañeros por una app. ¿Qué haces?', options:[{t:'Proponer alternativa segura y pedir consentimiento', pts:20, badge:'Crítica'},{t:'Compartir sólo con amigos', pts:5},{t:'Compartir sin preguntar', pts:-10}]},
      { text: 'Un compañero difunde memes ofensivos en el chat de clase. ¿Cómo actúas?', options:[{t:'Hablas con él y reportas al docente', pts:20, badge:'Responsable'},{t:'Ignoras el tema', pts:0},{t:'Te unes a la burla', pts:-15}]} 
    ];

    function render() {
      if(screen==='home') {
        gameEl.innerHTML = `
          <h2>Bienvenido/a</h2>
          <p>Elige un reto para comenzar: emparejar conceptos, tomar decisiones o responder un quiz cronometrado.</p>
          <input placeholder="Escribe tu nombre" value="${player.name}" oninput="player.name=this.value" style="padding:0.5rem;width:100%;margin:0.5rem 0;"/>
          <button onclick="startMatch()">🧩 Comenzar: Emparejar</button>
          <button onclick="startScenario()">⚖️ Comenzar: Escenario</button>
          <button onclick="startQuiz()">⏱️ Comenzar: Quiz cronometrado</button>
          <div class='leaderboard'>
            <h3>🏆 Leaderboard</h3>
            <ol>${leaderboard.map(e=>`<li>${e.name} — ${e.score} pts</li>`).join('')||'<li>Sin registros aún</li>'}</ol>
          </div>
        `;
      }
      else if(screen==='match') {
        gameEl.innerHTML = `
          <h2>Empareja conceptos</h2>
          <p>Selecciona dos tarjetas relacionadas y comprueba.</p>
          <div class='grid'>${matchPairs.flat.map(f=>`<button onclick=\"toggleSelect(${f.id})\" class='${selected.includes(f.id)?'selected':''}'>${f.text}</button>`).join('')}</div>
          <button onclick="checkMatch()">Comprobar</button>
          <button onclick="goHome()">Volver</button>
        `;
      }
      else if(screen==='scenario') {
        const sc = scenarios[Math.floor(Math.random()*scenarios.length)];
        window.currentScenario = sc;
        gameEl.innerHTML = `
          <h2>Escenario: Uso de TIC</h2>
          <p>${sc.text}</p>
          ${sc.options.map((o,i)=>`<button onclick=\"chooseScenario(${i})\">${o.t}</button>`).join('')}
        `;
      }
      else if(screen==='quiz') {
        const q = quizzes[quizIndex];
        gameEl.innerHTML = `
          <div style='display:flex;justify-content:space-between;'><h2>Quiz</h2><span>⏳ ${timeLeft}s</span></div>
          <div class='question'><strong>${q.q}</strong>${q.options.map((o,i)=>`<button onclick=\"answerQuiz(${i})\">${o}</button>`).join('')}</div>
          <button onclick=\"endGame()\">Terminar</button>
        `;
      }
      else if(screen==='final') {
        gameEl.innerHTML = `
          <h2>🏁 Juego terminado</h2>
          <p>${player.name||'Jugador'} — ${player.score} puntos</p>
          <div>${player.badges.map(b=>`<span class='badge'>${b}</span>`).join('')||'No obtuviste badges.'}</div>
          <button onclick=\"goHome()\">Volver al inicio</button>
        `;
      }
    }

    function startMatch(){
      const items = [['Aula virtual','Plataforma de aprendizaje'],['Ciberseguridad','Protección de datos'],['Gamificación','Uso de juegos para aprender']];
      const flat = items.flat().map((t,i)=>({id:i,text:t}));
      for(let i=flat.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[flat[i],flat[j]]=[flat[j],flat[i]]}
      matchPairs={pairs:items,flat};
      selected=[]; screen='match'; render();
    }
    function toggleSelect(id){if(selected.includes(id))selected=selected.filter(x=>x!==id); else if(selected.length<2)selected.push(id); render();}
    function checkMatch(){const texts=selected.map(id=>matchPairs.flat.find(f=>f.id===id).text);let correct=false;matchPairs.pairs.forEach(p=>{if(p.includes(texts[0])&&p.includes(texts[1]))correct=true});if(correct){player.score+=15;matchPairs.flat=matchPairs.flat.filter(f=>!selected.includes(f.id));if(matchPairs.flat.length<=0){player.badges.push('Conectora');screen='scenario';}selected=[];}else{player.score=Math.max(0,player.score-5);selected=[];}render();}

    function startScenario(){screen='scenario';render();}
    function chooseScenario(i){const opt=window.currentScenario.options[i];player.score+=opt.pts;if(opt.badge)player.badges.push(opt.badge);startQuiz();}

    function startQuiz(){quizIndex=0;timeLeft=30;screen='quiz';render();interval=setInterval(()=>{timeLeft--;if(timeLeft<=0){clearInterval(interval);endGame();}render();},1000);}
    function answerQuiz(i){if(i===quizzes[quizIndex].a)player.score+=quizzes[quizIndex].points;if(quizIndex<quizzes.length-1)quizIndex++;else endGame();render();}

    function endGame(){clearInterval(interval);leaderboard.push({name:player.name||'Anon',score:player.score});leaderboard.sort((a,b)=>b.score-a.score);leaderboard=leaderboard.slice(0,10);localStorage.setItem('tic_leaderboard',JSON.stringify(leaderboard));screen='final';render();}

    function goHome(){player={name:'',score:0,badges:[]};screen='home';render();}

    render();
  </script>
</body>
</html>
