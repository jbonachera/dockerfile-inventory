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
            <md-table-row v-for="(project, index) in displayedProjects"
                          :key="index">
              <md-table-cell>{{ project.name }} </md-table-cell>
              <md-table-cell>{{ project.baseImage }} </md-table-cell>
              <md-table-cell>{{ project.hubName }} </md-table-cell>
              <md-table-cell>{{ project.stars }} </md-table-cell>
            </md-table-row>
          </md-table-body>
        </md-table>
        <md-table-pagination
          md-size="5"
          :md-total="projects.length"
          v-bind:md-page="currentPage"
          md-label="Page"
          md-separator="of"
          :md-page-options="[5]"
          @pagination="onPagination"></md-table-pagination>
      </md-table-card>
    </md-layout>
    <md-snackbar md-position="bottom center" ref="snackbar" md-duration="30000">
      <span>Request rate-limited. Please wait and retry in {{ rrReset }}.</span>
      <md-button class="md-accent" md-theme="light-blue"
                 @click.native="$refs.snackbar.close()">Close
      </md-button>
    </md-snackbar>
  </md-layout>
</template>
<script>
  import axios from 'axios'
  import moment from 'moment'
  export default {
    name: 'projectsList',
    methods: {
      onPagination (event) {
        this.displayedProjects = this.projects.slice(event.page * 5, event.page * 5 + 5)
      },
      fetchPage (page) {
        if (!page) {
          page = 1
          this.projects = []
        }
        return axios.get(`https://api.github.com/users/${this.user}/repos?sort=pushed&per_page=${this.itemPerPage}&page=${page}`)
          .then(resp => {
            const links = resp.headers.link.split(',')
            links.forEach(item => {
              const match = item.match(/.*per_page=[0-9]+&page=([0-9]+)>; rel="next"/)
              if (match) {
                this.$nextTick(() => {
                  this.fetchPage(match[1])
                })
              }
            })
            return resp.data.filter(repo => {
              return repo.name.startsWith('docker-')
            })
          })
          .then(repoList => {
            repoList.forEach(repo => {
              const name = repo.name.replace('docker-', '')
              this.projects.push({
                name: name,
                baseImage: 'bla',
                hubName: `${this.user}/${name}`,
                stars: repo.stargazers_count
              })
            })
          })
          .catch(err => {
            console.log(err.response)
            if (err.response.status === 403) {
              this.rrReset = moment.unix(parseInt(err.response.headers['x-ratelimit-reset'])).fromNow()
              this.$refs['snackbar'].open()
            }
          })
      }
    },
    data () {
      return {
        user: 'jbonachera',
        itemPerPage: 20,
        currentPage: 1,
        lastPage: 0,
        projects: [],
        displayedProjects: [],
        rrReset: 0
      }
    },
    mounted () {
      this.$nextTick(this.fetchPage)
      this.onPagination({page: 1})
    }
  }
</script>
