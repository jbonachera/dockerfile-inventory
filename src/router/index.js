import Vue from 'vue'
import Router from 'vue-router'
import ProjectsList from '@/components/ProjectsList'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'ProjectList',
      component: ProjectsList
    }
  ]
})
