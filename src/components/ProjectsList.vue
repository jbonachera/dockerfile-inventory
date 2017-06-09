<template>
  <md-layout md-column>
    <md-layout md-align="center">
      <h2 class="md-title">Docker repository list for {{ user }}</h2>
    </md-layout>
    <md-layout>
      <md-layout md-align="center">
        <md-table-card>
          <md-table @sort="onSort">
            <md-table-header>
              <md-table-row>
                <md-table-head md-sort-by="name">Name</md-table-head>
                <md-table-head md-sort-by="baseImage">Base-Image</md-table-head>
                <md-table-head md-sort-by="hubName">Docker hub repository name
                </md-table-head>
                <md-table-head md-sort-by="stars">
                  Github stars
                </md-table-head>
              </md-table-row>
            </md-table-header>
            <md-table-body>
              <md-table-row v-for="(project, index) in displayedProjects"
                            :key="index">
                <md-table-cell><a
                  :href="`https://github.com/${user}/docker-${project.name}/`">{{ project.name
                  }}</a></md-table-cell>
                <md-table-cell>{{ project.baseImage }} </md-table-cell>
                <md-table-cell>{{ project.hubName }} </md-table-cell>
                <md-table-cell>{{ project.stars }} </md-table-cell>
              </md-table-row>
            </md-table-body>
          </md-table>
          <md-table-pagination
            v-bind:md-size="pageSize"
            md-total="Many"
            v-bind:md-page="currentPage"
            md-label="Items"
            md-separator="of"
            :md-page-options="[10, 20]"
            @pagination="onPagination"></md-table-pagination>
        </md-table-card>
      </md-layout>
      <md-layout md-align="center">
        <h2 class="md-title">Statistics</h2>
        <vue-chart chart-type="PieChart" :columns="graph.columns"
                   :rows="graph.rows"
                   :options="graph.options"></vue-chart>
      </md-layout>
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
      fetchDockerInfo (item) {
        return axios.get(`https://raw.githubusercontent.com/${this.user}/docker-${item.name}/master/Dockerfile`)
          .then(resp => {
            const dockerfile = resp.data
            dockerfile.split('\n').forEach(line => {
              if (line.startsWith('FROM')) {
                item.baseImage = line.split(' ')[1]
              }
            })
            this.refreshDisplay()
          })
      },
      onSort (e) {
        this.projects.sort((a, b) => {
          if (e.type === 'asc') {
            return b[e.name] - a[e.name]
          } else {
            return a[e.name] - b[e.name]
          }
        })
        this.currentPage = 1
        this.refreshDisplay()
      },
      refreshDisplay () {
        let start = (this.currentPage - 1) * this.pageSize
        let end = (this.currentPage - 1) * this.pageSize + this.pageSize
        if (end > this.projects.length) {
          end = this.projects.length
        }
        if (start > this.projects.length) {
          start = this.projects.length
        }
        this.displayedProjects = this.projects.slice(start, end)
        this.refreshGaph()
      },
      onPagination (event) {
        this.pageSize = event.size
        this.currentPage = event.page
        this.refreshDisplay()
      },
      fetchPage (page) {
        if (!page) {
          page = 1
          this.projects = []
        }
        return axios.get(`https://api.github.com/users/${this.user}/repos?sort=pushed&per_page=${this.itemPerPage}&page=${page}`)
          .then(resp => {
            if (resp.headers.link) {
              const links = resp.headers.link.split(',')
              links.forEach(item => {
                const match = item.match(/.*per_page=[0-9]+&page=([0-9]+)>; rel="next"/)
                if (match) {
                  this.$nextTick(() => {
                    this.fetchPage(match[1])
                  })
                }
              })
            }
            return resp.data.filter(repo => {
              return repo.name.match(/^docker-/)
            })
          })
          .then(repoList => {
            repoList.forEach(repo => {
              const name = repo.name.replace('docker-', '')
              const project = {
                name: name,
                baseImage: 'bla',
                hubName: `${this.user}/${name}`,
                stars: parseInt(repo.stargazers_count)
              }
              this.projects.push(project)
              this.fetchDockerInfo(project)
            })
            this.refreshDisplay()
          })
          .catch(err => {
            if (err.response && err.response.status === 403) {
              this.rrReset = moment.unix(parseInt(err.response.headers['x-ratelimit-reset'])).fromNow()
              this.$refs['snackbar'].open()
            }
          })
      },
      refreshRows () {
        const baseImages = this.projects.reduce((acc, val) => {
          if (!acc[val.baseImage]) {
            acc[val.baseImage] = 0
          }
          acc[val.baseImage] += 1
          return acc
        }, {})
        this.graph.rows = Object.keys(baseImages || {}).map(name => {
          return [name, baseImages[name]]
        })
      },
      refreshGaph () {
        this.refreshRows()
        console.log(this.graph.rows)
      }
    },
    data () {
      return {
        user: 'jbonachera',
        itemPerPage: 200,
        currentPage: 1,
        pageSize: 10,
        projects: [],
        displayedProjects: [],
        rrReset: 0,
        graph: {
          columns: [
            {
              'type': 'string',
              'label': 'Name'
            },
            {
              'type': 'number',
              'label': 'Count'
            }
          ],
          rows: [],
          options: {
            title: 'Base images repartition',
            width: 900,
            height: 500,
            pieHole: 0.4
          }
        }
      }
    },
    mounted () {
      this.$nextTick(this.fetchPage)
    }
  }
</script>
