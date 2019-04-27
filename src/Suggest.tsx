import * as React from 'react';

import './Suggest.scss';
interface List {
  yomi:string,
  code:string,
  name:string
}
interface SuggestState{
  query: any,
  focus: number,
  isVisible: boolean,
  [stateName: string]: any;
}
interface SuggestProps extends SuggestState{
  filterList: List[],
}

function List(props: SuggestProps){
  // 他要素クリック時や、ページ読み込み時には表示しない
  if(!props.isVisible){
    return null;
  }

  // クエリ未入力時には表示しない
  if(props.query === ''){
    return null;
  }

  // すでに選択済みの場合は表示しない
  if(props.filterList.length === 1 && props.filterList[0] && props.filterList[0].name === props.query){
    return null;
  }

  // 候補が見つからない場合
  if(props.filterList.length === 0){
    return (
      <div className="suggest__list-wrap">
        <div className="suggest__list">
          <div className="suggest__list-item is-notfound">候補が見つかりません</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="suggest__list-wrap">
      <ul className="suggest__list">
        {props.filterList.map((obj, index)=>{
          const focusFlg = (index === props.focus)? "is-focus":"";
          return (
            <li className={`suggest__list-item ${focusFlg}`} data-key={obj.code} key={obj.code} onClick={props.onclick}>
              {obj.name}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

class Suggest extends React.Component<SuggestProps,SuggestState>{
  private filterList: List[] = []; 
  private originList: List[] = [];
  private url: string;
  private suggestDom:any = React.createRef();

  constructor(props:SuggestProps) {
    super(props);
    this.state = {
      query: '',
      focus: -1,
      isVisible: false
    }; 
    this.url = props.url;
    this.fetchList(); // 全候補を取得してstateを更新
    this.listClose = this.listClose.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick (event: any){
    const key = event!.target!.dataset!.key,
      clickObj = this.filterList.find(obj => {
        return obj.code === key
      });
    if(clickObj && clickObj.name){
      this.setState({
        query:clickObj.name,
        focus:-1,
      });
    }
  }

  handleChange (event: any) {
    const isVisible = event.target.value !==　'' ? true : false;
    this.setState({
      query: event.target.value,
      focus:-1,
      isVisible:isVisible
    });
  }

  handleKeyup(event: any){
    const keyCode = event.which || event.keyCode || 0;
    if(keyCode === 38){
      this.moveFocus(-1);
      return false;
    }else if(keyCode === 40){
      this.moveFocus(1);
      return false;
    }else if(keyCode === 13){
      this.selectSuggest();
      return false;
    }
  }

  moveFocus(step: number){
    // 非表示時にはUpKeyは無効
    if(!this.state.isVisible && step === 1){
      return false;
    }
    // focusが最下部にある時にはUpDownは無効
    if(this.state.focus === this.filterList.length -1 && step === 1){
      return false;
    }
    this.setState({focus:this.state.focus + step});
  }

  selectSuggest(){
    if(this.state.focus === -1){
      return false;
    }
    this.setState({
      query:this.filterList[this.state.focus].name,
      focus:-1
    });
  }

  fetchList(){
    fetch(this.url).then((response) => {
      if(response.clone().json()){
        return response.clone().json();
      }else{
        throw new Error("file not found.");
      }
    }).then((list)=>{
      this.originList =list.data;
    }).catch((e)=>{
      console.log(e);
    });
  }

  listClose(event: any){
    // クリックした要素がsuggestWrapper内の要素かを判定
		let flag=false;
    event.path.forEach((thisPath:any) => {
      flag=(thisPath === this.suggestDom.current)? true : flag;
    });
    //要素外をクリックした場合はサジェストを非表示に
    if(!flag && this.state.isVisible){
      this.setState({isVisible:false});
    }
  }

  render(): JSX.Element {
    const query = this.state.query;
    this.filterList = this.originList.filter((obj)=>{
      return (query !== '' && (~obj.yomi.indexOf(query) || ~obj.name.indexOf(query)))
    });
    return (
      <div className="suggest" ref={this.suggestDom}>
        <input type="text" name="hoge" value={query} onChange={(e) => this.handleChange(e)} onKeyUp={(e) => {this.handleKeyup(e)}} className="suggest__input" />
        <List filterList={this.filterList} query={query} isVisible={this.state.isVisible} focus={this.state.focus} onclick={this.handleClick}/>
      </div>
    );
  }

  componentDidMount(){
    document.addEventListener('click', this.listClose);
  }

  componentDidUpdate(prevProps: SuggestProps, prevState: SuggestState) {
    // 上下カーソル入力があった再描画の場合のみ、スクロール位置合わせを実行
    if(this.state.focus !== -1 && this.state.focus !== prevState.focus){
      const index = this.state.focus;
      const list = this.suggestDom.current.getElementsByClassName('suggest__list-wrap');
      const items = this.suggestDom.current.getElementsByClassName('suggest__list-item');
      if(list[0] && items[index]){
        let itemsHeight = 0;
        for(let i = 0; i < index; i++){
          const thisHeight = items[i].getBoundingClientRect().height;
          itemsHeight += thisHeight;
        }
        list[0].scrollTop = itemsHeight;
      };
    }
  }
}

export default Suggest;

