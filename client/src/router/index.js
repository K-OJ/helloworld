import { createRouter, createWebHashHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MainView from '../views/MainView.vue'
import IntroView from '../views/IntroView.vue'
import AnalysisView from '../views/AnalysisView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginView },
  { path: '/main', component: MainView },
  { path: '/intro', component: IntroView },
  { path: '/analysis', component: AnalysisView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
