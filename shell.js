/* An in-memory shell for exploring the portfolio. Nothing touches the host OS. */
(() => {
  class PortfolioShell {
    constructor(files = {}) {
      this.cwd = '/home/visitor';
      this.previous = this.cwd;
      this.started = Date.now();
      this.files = new Map(Object.entries(files));
      this.dirs = new Set(['/', '/home', this.cwd, '/tmp', '/etc']);
      for (const path of this.files.keys()) {
        let parent = path.slice(0,path.lastIndexOf('/'));
        while(parent) { this.dirs.add(parent); parent = parent.slice(0,parent.lastIndexOf('/')); }
      }
      this.names = ['ls','pwd','cd','cat','tree','echo','date','uname','hostname','whoami','id','uptime','history','head','tail','wc','grep','find','touch','mkdir','rm','rmdir','mv','cp','printf','which','env','printenv','sudo','man'];
    }
    path(value = '.') {
      const expanded = value === '~' ? '/home/visitor' : value.replace(/^~\//,'/home/visitor/');
      const parts = (expanded.startsWith('/') ? expanded : this.cwd+'/'+expanded).split('/');
      const result = [];
      for (const part of parts) { if(part==='..') result.pop(); else if(part && part!=='.') result.push(part); }
      return '/'+result.join('/');
    }
    get promptPath() { return this.cwd.replace(/^\/home\/visitor(?=\/|$)/,'~'); }
    entries(path) {
      const prefix = path === '/' ? '/' : path+'/';
      return [...new Set([...this.dirs,...this.files.keys()])].filter(p=>p.startsWith(prefix)&&p!==path&&!p.slice(prefix.length).includes('/')).sort();
    }
    read(path) {
      if(this.dirs.has(path)) throw Error('Is a directory');
      if(!this.files.has(path)) throw Error('No such file or directory');
      return this.files.get(path);
    }
    tokenize(line) {
      const result=[]; let token='', quote='', started=false;
      for(let i=0;i<line.length;i++) {
        const c=line[i];
        if(c==='\\' && quote!=="'") { if(i+1>=line.length) throw Error('Incomplete escape'); token+=line[++i]; started=true; }
        else if(quote) { if(c===quote) quote=''; else token+=c; }
        else if(c==='"'||c==="'") { quote=c; started=true; }
        else if(/\s/.test(c)) { if(started) {result.push(token);token='';started=false;} }
        else {token+=c;started=true;}
      }
      if(quote) throw Error('Unclosed quote');
      if(started) result.push(token);
      return result;
    }
    complete(line, extras=[]) {
      const pos=line.lastIndexOf(' '), fragment=line.slice(pos+1);
      if(pos<0) return [...new Set([...this.names,...extras])].filter(x=>x.startsWith(fragment)).sort();
      const slash=fragment.lastIndexOf('/'), prefix=fragment.slice(0,slash+1), stem=fragment.slice(slash+1);
      return this.entries(this.path(prefix||'.')).filter(p=>p.split('/').pop().startsWith(stem)).map(p=>line.slice(0,pos+1)+prefix+p.split('/').pop()+(this.dirs.has(p)?'/':''));
    }
    execute(line, history=[]) {
      let cmd='shell';
      try {
        let tokens=this.tokenize(line); cmd=tokens.shift();
        if(!this.names.includes(cmd)) return null;
        // Explicitly avoid pretending to execute unsupported shell syntax.
        if(tokens.some(t=>['|','>','>>','&&',';'].includes(t))) throw Error('Pipes, redirection, and command chaining are not supported in this portfolio shell');
        const flags=tokens.filter(t=>t.startsWith('-')&&t!=='-');
        const args=tokens.filter(t=>!flags.includes(t));
        const target=this.path(args[0]);
        const need = n => {if(args.length<n) throw Error('Missing operand');};
        switch(cmd) {
          case 'pwd': return this.cwd;
          case 'cd': {const dest=args[0]==='-'?this.previous:this.path(args[0]||'~');if(!this.dirs.has(dest))throw Error('No such directory');this.previous=this.cwd;this.cwd=dest;return args[0]==='-'?dest:'';}
          case 'ls': {
            if(this.files.has(target))return target.split('/').pop();
            if(!this.dirs.has(target))throw Error('No such directory');
            let rows=this.entries(target).filter(p=>flags.some(f=>f.includes('a'))||!p.split('/').pop().startsWith('.'));
            return rows.map(p=>(flags.some(f=>f.includes('l'))?(this.dirs.has(p)?'drwxr-xr-x':'-rw-r--r--')+' visitor visitor  ':'')+p.split('/').pop()+(this.dirs.has(p)?'/':'')).join(flags.some(f=>f.includes('l'))?'\n':'  ');
          }
          case 'cat': need(1); return args.map(p=>this.read(this.path(p))).join('\n');
          case 'echo': return tokens.join(' ').replace(/\$(USER|HOME|PWD|SHELL)\b/g,(_,key)=>({USER:'visitor',HOME:'/home/visitor',PWD:this.cwd,SHELL:'/bin/portfolio-sh'}[key]));
          case 'printf': return tokens.join(' ').replace(/\\n/g,'\n');
          case 'date': return new Date().toString();
          case 'uname': return flags.includes('-a')?'Afaq Linux · browser-based portfolio shell':'Afaq Linux';
          case 'hostname': return 'afaq-linux';
          case 'whoami': return 'visitor';
          case 'id': return 'uid=1000(visitor) gid=1000(visitor) groups=1000(visitor)';
          case 'uptime': return `Session uptime: ${Math.floor((Date.now()-this.started)/1000)} seconds`;
          case 'history': return history.map((h,i)=>`${String(i+1).padStart(4)}  ${h}`).join('\n');
          case 'env': case 'printenv': return `USER=visitor\nHOME=/home/visitor\nPWD=${this.cwd}\nSHELL=/bin/portfolio-sh\nTERM=xterm-256color`;
          case 'which': need(1); return args.map(x=>this.names.includes(x)?'/bin/'+x:x+': not found').join('\n');
          case 'sudo': return 'visitor is not in the sudoers file. Nice try, though.';
          case 'man': return 'Portfolio shell: cd [path], ls [-la] [path], cat <file>, tree [path],\ngrep [-i] <text> <file>, head/tail <file>, wc <file>, find [path],\nmkdir/touch <path>, cp/mv <source> <destination>, rm <file>, rmdir <empty-dir>.\nFiles are temporary and reset on reload. No host OS access.\nUse help for portfolio commands.';
          case 'head': case 'tail': {need(1);let lines=this.read(target).split('\n');return (cmd==='head'?lines.slice(0,10):lines.slice(-10)).join('\n');}
          case 'wc': {need(1);const text=this.read(target);return `${text.split('\n').length} lines  ${text.trim()?text.trim().split(/\s+/).length:0} words  ${text.length} chars  ${args[0]}`;}
          case 'grep': {need(2);const needle=flags.includes('-i')?args[0].toLowerCase():args[0];return this.read(this.path(args[1])).split('\n').filter(l=>(flags.includes('-i')?l.toLowerCase():l).includes(needle)).join('\n');}
          case 'tree': case 'find': {
            if(!this.dirs.has(target))throw Error('No such directory');
            let rows=[target]; const walk=(p,depth)=>{for(const child of this.entries(p)){rows.push(cmd==='find'?child:'  '.repeat(depth)+'└─ '+child.split('/').pop()+(this.dirs.has(child)?'/':''));if(this.dirs.has(child))walk(child,depth+1);}};walk(target,0);return rows.join('\n');
          }
          case 'mkdir': case 'touch': {
            need(1);if(this.files.size+this.dirs.size>=200)throw Error('Session file limit reached');
            if(!this.dirs.has(target.slice(0,target.lastIndexOf('/'))||'/'))throw Error('Parent directory does not exist');
            if(cmd==='mkdir') {if(this.dirs.has(target)||this.files.has(target))throw Error('File exists');this.dirs.add(target);}
            else if(!this.dirs.has(target)&&!this.files.has(target))this.files.set(target,'');return '';
          }
          case 'rm': need(1);if(flags.length)throw Error('Only single-file removal is supported');this.read(target);this.files.delete(target);return '';
          case 'rmdir': need(1);if(!this.dirs.has(target))throw Error('No such directory');if(this.entries(target).length||this.cwd===target||this.cwd.startsWith(target+'/')||target==='/')throw Error('Directory is not empty or is in use');this.dirs.delete(target);return '';
          case 'cp': case 'mv': {
            need(2);const contents=this.read(target);let dest=this.path(args[1]);if(this.dirs.has(dest))dest+='/'+target.split('/').pop();
            if(dest===target)return '';
            if(this.files.has(dest))throw Error('Destination already exists');
            if(this.files.size>=200)throw Error('Session file limit reached');
            if(!this.dirs.has(dest.slice(0,dest.lastIndexOf('/'))||'/'))throw Error('Parent directory does not exist');
            this.files.set(dest,contents);if(cmd==='mv')this.files.delete(target);return '';
          }
        }
      } catch(error) {return `${cmd}: ${error.message}`;}
    }
  }
  globalThis.PortfolioShell = PortfolioShell;
})();
