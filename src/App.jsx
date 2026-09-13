import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'whitespace.v1'

const initialProjects = [
  { id: 'p1', title: 'RoomRadar', pitch: 'Live map of empty study rooms across campus.', description: 'Scrapes the room booking system plus crowd-sourced check-ins so you can find an empty seat in under a minute. Backend done, mobile UI half done.\n\nNext: push notifications when a room near you frees up.', owner: 'Marcus Lim', github: 'https://github.com/example/roomradar', status: 'ongoing', needs: ['builders', 'testers'], goal: 0, funded: 0, builders: ['Marcus Lim', 'Aisha K.'], testers: ['Ben T.'], mentors: [], sponsors: [], tags: ['mobile', 'maps'] },
  { id: 'p2', title: 'Canteen Queue Predictor', pitch: 'Tells you which stall has the shortest line, before you walk over.', description: 'Uses the campus Wi-Fi access point counts as a proxy for crowd density. Model is trained; needs a front end and someone to validate it against real queue times.', owner: 'Priya Nair', github: 'https://github.com/example/queue-predictor', status: 'ongoing', needs: ['builders', 'testers', 'mentor'], goal: 0, funded: 0, builders: ['Priya Nair'], testers: [], mentors: [], sponsors: [], tags: ['data', 'ml'] },
  { id: 'p3', title: 'LabShare', pitch: 'Borrow idle lab equipment from other departments.', description: 'An inventory of gear that sits unused most of the week: oscilloscopes, 3D printers, sensor kits. Departments list what they have and students book slots.\n\nWe have three departments on board and need help with the booking flow.', owner: 'Wei Jun', github: '', status: 'ongoing', needs: ['builders', 'funding', 'mentor'], goal: 1500, funded: 400, builders: ['Wei Jun', 'Tan S.'], testers: [], mentors: ['Dr. Rahman'], sponsors: [], tags: ['hardware', 'ops'] },
  { id: 'p4', title: 'Peer Tutor Match', pitch: 'Match students who aced a module with those about to take it.', description: 'Simple two-sided matching with availability and a 30-minute intro call. Ran a pilot with 40 students last term.', owner: 'Aisha K.', github: 'https://github.com/example/peer-tutor', status: 'onhold', needs: ['funding', 'mentor'], goal: 800, funded: 0, builders: ['Aisha K.'], testers: ['Marcus Lim'], mentors: [], sponsors: [], tags: ['community'] },
  { id: 'p5', title: 'Grant Finder', pitch: 'One search box for every student grant and seed fund on campus.', description: 'Scraped and cleaned every funding page we could find, tagged by eligibility and deadline. Shipped and used by around 200 students. Looking for someone to keep it maintained.', owner: 'Ben T.', github: 'https://github.com/example/grant-finder', status: 'completed', needs: ['builders'], goal: 0, funded: 0, builders: ['Ben T.', 'Priya Nair'], testers: ['Wei Jun', 'Aisha K.'], mentors: ['J. Ong'], sponsors: [], tags: ['web'] },
  { id: 'p6', title: 'Solar Bench', pitch: 'Outdoor bench that charges your laptop from a panel on its back.', description: 'Prototype v1 works but the battery only lasts 40 minutes. Need an electrical engineering hand and money for a better cell.', owner: 'Tan S.', github: '', status: 'ongoing', needs: ['builders', 'funding', 'testers'], goal: 2000, funded: 1250, builders: ['Tan S.'], testers: [], mentors: [], sponsors: ['Alumni Circle', 'GreenTech SG'], tags: ['hardware', 'energy'] },
  { id: 'p7', title: 'Open Notes', pitch: 'Shared, versioned lecture notes with a git-style history.', description: 'Markdown notes per module, edited by anyone, with attribution and rollback. Frontend is Svelte. Needs testers across a few different modules to stress the merge logic.', owner: 'J. Ong', github: 'https://github.com/example/open-notes', status: 'ongoing', needs: ['testers'], goal: 0, funded: 0, builders: ['J. Ong', 'Ben T.'], testers: [], mentors: [], sponsors: [], tags: ['web', 'education'] },
  { id: 'p8', title: 'Hall Swap', pitch: 'Trade dorm rooms with someone who wants yours.', description: 'Got a great idea, no code yet. Looking for a co-founder who can build the matching and someone from hall admin to advise.', owner: 'Nadia R.', github: '', status: 'onhold', needs: ['builders', 'mentor'], goal: 0, funded: 0, builders: ['Nadia R.'], testers: [], mentors: [], sponsors: [], tags: ['community'] },
]

const roleLabels = { student: 'Student', mentor: 'Mentor', sponsor: 'Sponsor' }
const needLabels = { builders: 'Builders', testers: 'Testers', mentor: 'Mentor', funding: 'Funding' }
const statusLabels = { ongoing: 'Ongoing', onhold: 'On hold', completed: 'Completed' }
const peopleOf = (project) => [...new Set([...(project.builders || []), ...(project.testers || []), ...(project.mentors || []), ...(project.sponsors || [])])]
const initials = (name) => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
const readSaved = () => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    return saved && Array.isArray(saved.projects) ? saved : null
  } catch {
    return null
  }
}

function App() {
  const saved = readSaved()
  const [user, setUser] = useState(saved?.user || null)
  const [role, setRole] = useState('student')
  const [page, setPage] = useState(saved?.view || 'main')
  const [projects, setProjects] = useState(saved?.projects || initialProjects)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState('')
  const [passed, setPassed] = useState(saved?.passed || [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, projects, view: page, passed }))
  }, [page, passed, projects, user])

  const showToast = useCallback((message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }, [])

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const askingFor = page === 'mentors' ? 'mentor' : 'funding'
    const matchesFilter = filter === 'all' || (filter === 'asking' ? project.needs.includes(askingFor) : project.status === filter)
    const query = search.trim().toLowerCase()
    return matchesFilter && (!query || `${project.title} ${project.pitch}`.toLowerCase().includes(query))
  }), [filter, page, projects, search])

  const signUp = (event) => {
    event.preventDefault()
    const name = new FormData(event.currentTarget).get('name')
    if (name) setUser({ name, role })
  }

  const addProject = (event) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const needs = data.getAll('need')
    const project = {
      id: `p${Date.now()}`, title: data.get('title'), pitch: data.get('pitch'), description: data.get('description') || 'A new project from the campus community.', desc: data.get('description') || 'A new project from the campus community.', github: data.get('github') || '', status: data.get('status'), owner: user.name, needs, goal: Number(data.get('goal')) || 0, funded: 0, builders: [user.name], testers: [], mentors: [], sponsors: [], tags: [],
    }
    setProjects((current) => [project, ...current])
    event.currentTarget.reset()
    setPage('main')
    showToast('Project posted')
  }

  const swipe = useCallback((direction) => {
    const builds = projects.filter((project) => project.status !== 'completed' && project.needs.includes('builders') && !project.builders.includes(user.name) && !passed.includes(project.id))
    const current = builds[0]
    if (!current) return
    if (direction === 'yes') {
      setProjects((items) => items.map((project) => project.id === current.id ? { ...project, builders: [...new Set([...project.builders, user.name])] } : project))
      showToast(`You joined ${current.title}`)
    } else setPassed((items) => [...new Set([...items, current.id])])
  }, [passed, projects, showToast, user])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (page !== 'builders' || selected || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return
      if (event.key === 'ArrowRight') swipe('yes')
      if (event.key === 'ArrowLeft') swipe('no')
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [page, selected, projects, passed, user, swipe])

  const toggleParticipation = (projectId, type) => {
    setProjects((items) => items.map((project) => {
      if (project.id !== projectId) return project
      const people = project[type].includes(user.name) ? project[type].filter((name) => name !== user.name) : [...project[type], user.name]
      return { ...project, [type]: people }
    }))
  }

  const sponsor = (projectId, amount) => {
    if (!(amount > 0)) return false
    setProjects((items) => items.map((project) => project.id === projectId ? { ...project, funded: project.funded + amount, sponsors: project.sponsors.includes(user.name) ? project.sponsors : [...project.sponsors, user.name], needs: project.goal && project.funded + amount >= project.goal ? project.needs.filter((need) => need !== 'funding') : project.needs } : project))
    return true
  }

  const updateProject = (projectId, changes) => setProjects((items) => items.map((project) => project.id === projectId ? { ...project, ...changes } : project))
  const deleteProject = (projectId) => setProjects((items) => items.filter((project) => project.id !== projectId))

  const navItems = [
    ['main', 'Projects'], ['upload', 'Post a project'], ['builders', 'Find a build'], ['testers', 'Test something'],
    ...(user?.role === 'mentor' ? [['mentors', 'Mentor a project']] : []),
    ...(user?.role === 'sponsor' ? [['funding', 'Fund a project']] : []),
  ]

  if (!user) return <Signup role={role} setRole={setRole} onSubmit={signUp} projects={projects} />

  return <div id="app" className="on">
    <aside>
      <div className="wordmark"><i />Whitespace</div>
      <nav>{navItems.map(([id, label]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => { setPage(id); setFilter(id === 'mentors' ? 'asking' : 'all') }}>{label}</button>)}</nav>
      <div className="me"><b>{user.name}</b><span>{roleLabels[user.role]}</span><div><button className="btn quiet small" onClick={() => setUser(null)}>Sign out</button></div></div>
    </aside>
    <main>
      {page === 'main' && <Projects projects={filteredProjects} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} open={setSelected} goUpload={() => setPage('upload')} user={user} />}
      {page === 'upload' && <Upload onSubmit={addProject} />}
      {page === 'builders' && <Builders projects={projects} passed={passed} user={user} onSwipe={swipe} open={setSelected} />}
      {page === 'testers' && <OpportunityList projects={projects.filter((project) => project.needs.includes('testers') && project.status !== 'completed')} action="Volunteer to test" type="testers" user={user} onAction={(project) => { toggleParticipation(project.id, 'testers'); showToast(`${project.testers.includes(user.name) ? 'Withdrawn from' : 'You are testing'} ${project.title}`) }} open={setSelected} />}
      {page === 'mentors' && <OpportunityList projects={projects.filter((project) => filter === 'all' || project.needs.includes('mentor') || project.mentors.includes(user.name))} action="Mentor this" type="mentors" user={user} onAction={(project) => { toggleParticipation(project.id, 'mentors'); showToast(`${project.mentors.includes(user.name) ? 'No longer mentoring' : 'You are mentoring'} ${project.title}`) }} filters={['asking', 'all']} filter={filter} setFilter={setFilter} open={setSelected} />}
      {page === 'funding' && <Funding projects={filteredProjects} filter={filter} setFilter={setFilter} user={user} onFund={(project, amount) => { if (sponsor(project.id, amount)) showToast(`Sponsored ${project.title} with S$${amount.toLocaleString()}`) }} open={setSelected} />}
    </main>
    {selected && <Modal project={selected} user={user} close={() => setSelected(null)} toggleParticipation={toggleParticipation} sponsor={sponsor} updateProject={updateProject} deleteProject={deleteProject} showToast={showToast} />}
    <div id="toast" className={toast ? 'on' : ''}>{toast}</div>
  </div>
}

function Signup({ role, setRole, onSubmit, projects }) {
  return <section id="signup"><div className="left"><div className="wordmark"><i />Whitespace</div><div><h1>Every project on campus, and the <mark>people</mark> it still needs.</h1><p>Students post what they&apos;re building. Builders, testers, mentors and sponsors find it. No more finding the makerspace by accident in your final year.</p></div><div className="stat-row"><div><b>{projects.length}</b>projects live</div><div><b>21</b>people involved</div><div><b>{projects.filter((project) => project.status === 'ongoing').length + 4}</b>open roles</div></div></div><div className="right"><form onSubmit={onSubmit}><h2>Join the campus</h2><p className="hint" style={{ marginBottom: 22 }}>Pick how you want to show up. You can sign out and switch roles any time.</p><div className="field"><label htmlFor="name">Your name</label><input id="name" name="name" placeholder="e.g. Priya Nair" autoComplete="name" required /></div><div className="roles" role="group" aria-label="Choose a role">{Object.entries(roleLabels).map(([id, label]) => <button type="button" className="role" data-role={id} aria-pressed={role === id} key={id} onClick={() => setRole(id)}><span className="sw">{id === 'sponsor' ? '$' : label[0]}</span><span><strong>{label}</strong><span>{id === 'student' ? 'Post ideas, join builds, volunteer to test' : id === 'mentor' ? 'Alumni or industry partner offering guidance' : 'Fund projects at any stage'}</span></span></button>)}</div><button className="btn primary" type="submit" style={{ width: '100%', justifyContent: 'center', padding: 12 }}>Enter Whitespace</button></form></div></section>
}

function PageHead({ title, description, action }) { return <div className="pagehead"><div><h1>{title}</h1><p>{description}</p></div>{action}</div> }
function Filters({ options, value, onChange, search, setSearch }) { return <div className="toolbar">{options.map((option) => <button className={`chip ${value === option ? 'on' : ''}`} key={option} onClick={() => onChange(option)}>{option === 'all' ? 'All' : option === 'onhold' ? 'On hold' : option === 'asking' ? 'Asking for a mentor' : statusLabels[option]}</button>)}{setSearch && <input className="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects" aria-label="Search projects" />}</div> }
function Projects({ projects, filter, setFilter, search, setSearch, open, goUpload, user }) { return <section className="page on"><PageHead title="Projects" description="Everything being built on campus right now. Open one to see who&apos;s on it and what it still needs." action={user.role === 'student' && <button className="btn primary" onClick={goUpload}>Post a project</button>} /><Filters options={['all', 'ongoing', 'onhold', 'completed']} value={filter} onChange={setFilter} search={search} setSearch={setSearch} /><div className="grid">{projects.length ? projects.map((project) => <ProjectCard key={project.id} project={project} user={user} open={() => open(project)} />) : <div className="empty"><b>No projects found</b>Try a different filter or search term.</div>}</div></section> }
function ProjectCard({ project, open, user }) { const people = peopleOf(project); const mine = user && (project.owner === user.name || people.includes(user.name)); return <article className="card" onClick={open} onKeyDown={(event) => event.key === 'Enter' && open()} tabIndex="0"><span className={`status ${project.status}`}>{statusLabels[project.status]}</span><h3>{project.title}</h3><p>{project.pitch}</p><div className="needs">{project.needs.map((need) => <span className={`need ${need === 'builders' ? 'hot' : ''}`} key={need}>{needLabels[need]}</span>)}{mine && <span className="need" style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}>You&apos;re on this</span>}</div><div className="meta"><span>by {project.owner}</span><span className="people">{people.slice(0, 4).map((person) => <span className="av" title={person} key={person}>{initials(person)}</span>)}{people.length > 4 && <span className="av">+{people.length - 4}</span>}</span></div></article> }

function Upload({ onSubmit }) { return <section className="page on"><PageHead title="Post a project" description="An idea is enough. Add a repo link if you have one, and say what kind of help you&apos;re looking for." /><div className="form-2col"><form onSubmit={onSubmit}><div className="field"><label htmlFor="u-title">Title</label><input id="u-title" name="title" required placeholder="What are you building?" /></div><div className="field"><label htmlFor="u-pitch">One-line pitch</label><input id="u-pitch" name="pitch" required maxLength="120" placeholder="Explain it to a stranger in the lift" /></div><div className="field"><label htmlFor="u-desc">Description</label><textarea id="u-desc" name="description" placeholder="What problem is it solving, what&apos;s done so far, what&apos;s next?" /></div><div className="field"><label htmlFor="u-gh">GitHub link</label><input id="u-gh" name="github" type="url" placeholder="https://github.com/you/repo" /><div className="hint">Optional. Ideas without code are welcome.</div></div><div className="field"><label htmlFor="u-status">Status</label><select id="u-status" name="status" defaultValue="ongoing"><option value="ongoing">Ongoing</option><option value="onhold">On hold</option><option value="completed">Completed</option></select></div><div className="field"><label>What do you need?</label><div className="checks">{Object.entries(needLabels).map(([value, label]) => <label className="check" key={value}><input type="checkbox" name="need" value={value} defaultChecked={value === 'builders'} /> {value === 'builders' ? `${label} to join the team` : value === 'testers' ? `${label} to try it and report back` : value === 'mentor' ? 'A mentor with relevant experience' : label}</label>)}</div></div><div className="field"><label htmlFor="u-goal">Funding goal (S$)</label><input id="u-goal" name="goal" type="number" min="0" step="50" defaultValue="0" /></div><button className="btn primary" type="submit">Post project</button></form><div className="preview"><div className="hint">Live preview</div><div className="card"><h3>Your project will appear here</h3><p>Complete the form to introduce your project to the campus community.</p></div></div></div></section> }

function Builders({ projects, passed, user, onSwipe, open }) { const builds = projects.filter((project) => project.status !== 'completed' && project.needs.includes('builders') && !project.builders.includes(user.name) && !passed.includes(project.id)); const project = builds[0]; const joinedProjects = projects.filter((item) => item.builders.includes(user.name) && item.owner !== user.name); return <section className="page on"><PageHead title="Find a build" description="Projects looking for builders. Swipe right to join, left to pass. Drag the card or use the buttons." /><div className="deck-wrap"><div><div className="deck">{project ? <div className="swipe"><span className="status ongoing">{statusLabels[project.status]}</span><h2>{project.title}</h2><p className="lead">{project.pitch}</p><div className="body">{project.description}</div><div className="needs">{project.needs.map((need) => <span className="need" key={need}>{needLabels[need]}</span>)}</div><div className="meta"><span>by {project.owner}</span><span>{project.builders.length} on the team{project.github ? ' · repo linked' : ''}</span></div></div> : <div className="empty"><b>You&apos;re all caught up</b>{passed.length ? <span>Show up here when someone posts a new one.</span> : <span>Check back soon for new builds.</span>}</div>}</div><div className="deck-controls"><button className="btn" onClick={() => onSwipe('no')} disabled={!project}>Pass</button><button className="btn quiet" onClick={() => project && open(project)} disabled={!project}>Details</button><button className="btn mark" onClick={() => onSwipe('yes')} disabled={!project}>Join this build</button></div></div><div className="side"><h3>Builds you&apos;ve joined</h3><ul>{joinedProjects.map((item) => <li key={item.id}><span>{item.title}</span><span className="hint">{item.owner}</span></li>)}</ul>{!joinedProjects.length && <p className="hint">Nothing yet. Join a build to see it here.</p>}<p className="hint" style={{ marginTop: 14 }}><span className="kbd">←</span> pass &nbsp; <span className="kbd">→</span> join</p></div></div></section> }

function OpportunityList({ projects, action, onAction, filters, filter, setFilter, type, user, open }) { return <section className="page on"><PageHead title={action === 'Volunteer to test' ? 'Test something' : 'Mentor a project'} description={action === 'Volunteer to test' ? 'Projects that need a second pair of eyes. Volunteer and the owner will reach out with a build to try.' : 'Teams that have asked for guidance. Pick the ones where your experience is actually useful.'} />{filters && <Filters options={filters} value={filter} onChange={setFilter} />}<div className="rows">{projects.map((project) => { const active = project[type].includes(user.name); return <div className="row" key={project.id}><div><div className="t"><h3>{project.title}</h3><span className={`status ${project.status}`}>{statusLabels[project.status]}</span>{type === 'mentors' && project.needs.includes('mentor') && <span className="need hot">Asking for a mentor</span>}</div><p>{project.pitch}</p><div className="sub">{project[type].length} {type === 'testers' ? 'tester' : 'mentor'}{project[type].length === 1 ? '' : 's'} so far · by {project.owner}</div></div><div style={{ display: 'flex', gap: 8 }}><button className="btn small" onClick={() => open(project)}>Details</button><button className={`btn small ${active ? '' : 'primary'}`} onClick={() => onAction(project)}>{active ? (type === 'testers' ? 'Withdraw' : 'Stop mentoring') : action}</button></div></div> })}</div></section> }

function Funding({ projects, filter, setFilter, onFund, open }) { return <section className="page on"><PageHead title="Fund a project" description="Filter by stage and back the ones you believe in. Money goes to the team&apos;s project account." /><Filters options={['all', 'ongoing', 'onhold', 'completed', 'asking']} value={filter} onChange={setFilter} /><div className="rows">{projects.map((project) => <div className="row fund" key={project.id}><div><div className="t"><h3>{project.title}</h3><span className={`status ${project.status}`}>{statusLabels[project.status]}</span>{project.needs.includes('funding') && <span className="need hot">Asking for funding</span>}</div><p>{project.pitch}</p><div className="fundnum"><span>S${project.funded.toLocaleString()} raised</span><b>{project.goal ? `S$${project.goal.toLocaleString()} goal` : 'No goal set'}</b></div></div><div>{project.goal ? <><div className="bar"><i style={{ width: `${Math.min(100, project.funded / project.goal * 100)}%` }} /></div><div className="fundnum"><b>S${project.funded.toLocaleString()}</b><span>of S${project.goal.toLocaleString()}</span></div></> : <div className="fundnum"><b>S${project.funded.toLocaleString()}</b><span>raised</span></div>}</div><div style={{ display: 'flex', gap: 8 }}><button className="btn small" onClick={() => open(project)}>Details</button><button className="btn small primary" onClick={() => { const amount = Number(window.prompt('Amount (S$)', '500')); if (amount > 0) onFund(project, amount) }}>{project.sponsors.includes(project.owner) ? 'Add more' : 'Sponsor'}</button></div></div>)}</div></section> }

function Modal({ project, user, close, toggleParticipation, sponsor, updateProject, deleteProject, showToast }) {
  const people = peopleOf(project)
  const isOwner = project.owner === user.name
  const isTester = project.testers.includes(user.name)
  const isMentor = project.mentors.includes(user.name)
  const isBuilder = project.builders.includes(user.name)
  const act = (type, label, activeLabel) => <button className={`btn ${type === 'join' || type === 'sponsor' ? 'primary' : ''}`} onClick={() => { if (type === 'sponsor') { const amount = Number(window.prompt('Amount (S$)', '500')); if (amount > 0 && sponsor(project.id, amount)) { showToast(`Sponsored ${project.title}`); close() } } else if (type === 'join') { updateProject(project.id, { builders: [...new Set([...project.builders, user.name])] }); showToast(`Joined ${project.title}`); close() } else { toggleParticipation(project.id, type); showToast(`${activeLabel ? 'No longer' : 'You are'} ${type === 'testers' ? 'testing' : 'mentoring'} ${project.title}`); close() } }}>{type === 'testers' ? (isTester ? 'Withdraw' : 'Volunteer to test') : type === 'mentors' ? (isMentor ? 'Stop mentoring' : 'Mentor this') : type === 'join' ? (isBuilder ? 'On the team' : 'Join this build') : 'Sponsor'}</button>
  return <div className="overlay on" onClick={close}><div className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><button className="x" onClick={close} aria-label="Close">X</button><div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}><span className={`status ${project.status}`} style={{ position: 'static' }}>{statusLabels[project.status]}</span>{project.tags.map((tag) => <span className="pill" key={tag}>{tag}</span>)}</div><h2>{project.title}</h2><p className="lead">{project.pitch}</p><div className="kv"><div><span>Owner</span><b>{project.owner}</b></div><div><span>Team</span><b>{project.builders.length}</b></div><div><span>Testers</span><b>{project.testers.length}</b></div><div><span>Funding</span><b>{project.goal ? `S$${project.funded.toLocaleString()} / S$${project.goal.toLocaleString()}` : project.funded ? `S$${project.funded.toLocaleString()}` : '-'}</b></div></div><p className="body">{project.description || 'No description yet.'}</p>{project.github && <p style={{ marginTop: 14 }}><a className="gh" href={project.github} target="_blank" rel="noreferrer">{project.github}</a></p>}<div className="needs" style={{ marginTop: 20 }}>{project.needs.length ? project.needs.map((need) => <span className="need hot" key={need}>{needLabels[need]}</span>) : <span className="hint">Not looking for anything right now.</span>}</div><div className="team">{people.map((person) => <span className="pill" key={person}>{person}</span>)}</div><div className="actions">{user.role === 'student' && !isOwner && project.needs.includes('builders') && !isBuilder && act('join', 'Join this build')} {user.role === 'student' && project.needs.includes('testers') && act('testers')} {user.role === 'mentor' && act('mentors')} {user.role === 'sponsor' && act('sponsor')} {isOwner && <><select className="btn" value={project.status} onChange={(event) => updateProject(project.id, { status: event.target.value })}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><button className="btn" style={{ color: 'var(--red)' }} onClick={() => { deleteProject(project.id); close(); showToast(`Deleted ${project.title}`) }}>Delete project</button></>}<button className="btn" onClick={close}>Close</button></div></div></div>
}

export default App
