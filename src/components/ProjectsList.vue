<template>
  <md-layout md-column>
    <md-layout md-align="center">
      <h2 class="md-title">Docker repository list for {{ user }}</h2>
    </md-layout>
    <md-layout md-align="center">
      <md-table-card>
        <md-table>
          <md-table-header>
            <md-table-row>
              <md-table-head md-sort-by="name">Name</md-table-head>
              <md-table-head md-sort-by="baseImage">Base-Image</md-table-head>
              <md-table-head md-sort-by="hubName">Docker hub repository name
              </md-table-head>
              <md-table-head md-sort-by="stars">
                <md-icon>star</md-icon>
              </md-table-head>
            </md-table-row>
          </md-table-header>
          <md-table-body>
            <md-table-row v-for="(project, index) in projects" :key="index">
              <md-table-cell>{{ project.name }} </md-table-cell>
              <md-table-cell>{{ project.baseImage }} </md-table-cell>
              <md-table-cell>{{ project.hubName }} </md-table-cell>
              <md-table-cell>{{ project.stars }} </md-table-cell>
            </md-table-row>
          </md-table-body>
        </md-table>
        <md-table-pagination
          v-bind:md-size="itemPerPage"
          :md-total="lastPage * itemPerPage"
          v-bind:md-page="currentPage"
          md-label="Page"
          md-separator="of"
          :md-page-options="[5, 10, 15]"
          @pagination="refreshProjects"></md-table-pagination>
      </md-table-card>
    </md-layout>
    <md-snackbar md-position="bottom center" ref="snackbar" md-duration="30000">
      <span>Request rate-limited. Please wait and retry later.</span>
      <md-button class="md-accent" md-theme="light-blue"
                 @click.native="$refs.snackbar.close()">Close
      </md-button>
    </md-snackbar>
  </md-layout>
</template>
<script>
  import axios from 'axios'
  export default {
    name: 'projectsList',
    methods: {
      refreshProjects (e) {
        if (e) {
          if (!e.page) {
            this.currentPage = 1
          } else {
            this.currentPage = e.page
          }
          if (!e.size) {
            this.itemPerPage = 5
          } else {
            this.itemPerPage = e.size
          }
        }
        return axios.get(`https://api.github.com/users/${this.user}/repos?sort=pushed&per_page=${this.itemPerPage}&page=${this.currentPage}`)
          .then(resp => {
            const links = resp.headers.link.split(',')
            links.forEach(item => {
              const match = item.match(/.*per_page=[0-9]+&page=([0-9]+)>; rel="last"/)
              if (match) {
                this.lastPage = match[1]
              }
            })
            return resp.data.filter(repo => {
              return repo.name.startsWith('docker-')
            })
          })
          .then(repoList => {
            this.projects = repoList.map(repo => {
              const name = repo.name.replace('docker-', '')
              return {
                name: name,
                baseImage: 'bla',
                hubName: `${this.user}/${name}`,
                stars: repo.stargazers_count
              }
            })
          })
          .catch(err => {
            if (err.message === 'Request failed with status code 403') {
              this.$refs['snackbar'].open()
            }
          })
      }
    },
    data () {
      return {
        user: 'jbonachera',
        itemPerPage: 10,
        currentPage: 1,
        lastPage: 0,
        projects: []
      }
    },
    mounted () {
      this.$nextTick(this.refreshProjects)
    }
  }
</script>
