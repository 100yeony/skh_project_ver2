// git install : rpm -ivh 파일명
// git delete : rpm -e git-core-2.18.1-3.el8.x86_64
// java install : rpm -ivh 파일명
// java delete : yum remove -y java* (rpm -e로 지우면 dependency때문에 못지움)
// python install : rpm -ivh 파일명
// python delete : python은 지울 수 없고 symbolic link로만 변경 가능
// maven install : rpm -ivh 파일명(dependencies 쩔음)
// maven delete : rpm -e maven

const installCmd = 'rpm -ivh'
const deleteCmd = 'rpm -e' //git, sshpass
const yumDeleteCmd = 'yum remove -y'

//dependencies걸려있는 애들은 yum remove 패키지명* 로 관련된거 다 지워버리기
// const java = 'java-1.8.0-openjdk'
const java = 'java'
const maven = 'maven'
const python = 'python2'


//송희 추가
const wgetCmd = 'wget -P'
const decompress = 'tar -xvzf'
const copy = 'cp -f'



module.exports = {
  installCmd,
  deleteCmd,
  yumDeleteCmd,

  java,
  maven,
  python,

  wgetCmd,
  decompress,
  copy
}
