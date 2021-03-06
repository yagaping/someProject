import React, { Component } from 'react';
import { connect } from 'dva';
import { Link } from 'dva/router';
import { Card, Form, Input, Select, Modal, Button, DatePicker,message,
  Tabs, 
} from 'antd';
import PageHeaderLayout from '../../layouts/PageHeaderLayout';
import NewsTable from '../../components/NewsTable';
import NewsModal from '../../components/NewsModal';
import styles from './NewsClassify.less';
import { sizeType, sizeChange } from '../../components/SizeSave';
import NewsType from '../../components/NewsType';
import moment from 'moment';

const FormItem = Form.Item;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { confirm } = Modal;
const { TabPane  } = Tabs;
const getValue = obj => Object.keys(obj).map(key => obj[key]).join(',');

const MODAL_TYPE = {
  ADD: 'add',
  MODIFY: 'modify',
};

// 配置提示信息
message.config({
  duration:1,
  maxCount:1
});
@connect(state => ({
  newsList: state.newsList,
}))
@Form.create()
export default class NewsClassify extends Component {

  state = {
    modalTitle: '标题',
    modalType: MODAL_TYPE.ADD, // add modify
    modalVisible: false,
    selectedRows: [],
    formValues: {},
    newsModifyData: {},
    newsAddData: {},
    searchTitle: '',
    searchId:'',
    searchNewsType: -1,
    searchNewsState: -1,
    searchIndex: 0,
    searchSize: 10,
    searchBeginDay: null,
    searchEndDay: null,
    searchRanking:'',
    searchSocuce:'',
    searchNewsGroup: null,
    contentType:-1,
    visible:false,
    newsTop:{
      title:'',
      visible:false,
      newsId:'',
      newsHot:'',
      startTime:'',
      endTime:'',
      bool:false,
    }
  };
 
  componentWillMount(){
    const { dispatch, match } = this.props;
    const { params:{type} } = match;
    dispatch({
      type:'newsList/getTabMenu',
      payload:{
        tabsType:parseInt(type),
      },
      callback:(res)=>{
        
        if(res.code == 0){
          const searchData = JSON.parse(localStorage.getItem('searchData'));
          const mark = localStorage.getItem('mark');
          if(searchData && mark){
            this.setState({
              ...searchData
            });
            localStorage.removeItem('mark');
            localStorage.removeItem('searchData');
          }else{
            this.setState({
              searchNewsGroup:res.result[0].newsType,
              tabId:res.result[0].id,
            });
          }
          this.queryNewsList();
        }else{
          message.error(res.message);
        }
      }
    })
  }

  componentDidMount() {

    // 查询新闻列表数据
    localStorage.setItem('newsUrl',this.props.match.url);
    
  }


  // 查询列表
  queryNewsList(obj) {
    const { dispatch } = this.props;
    let params = null;
    if(obj){
      params ={...this.state,...obj};
    }else{
      params ={...this.state};
    }
      
      const title = params.searchTitle;
      const newsId = params.searchId;
      const newsType = params.searchNewsType;
      const newsState = params.searchNewsState;
      const index = params.searchIndex;
      const beginDay = params.searchBeginDay;
      const endDay = params.searchEndDay;
      const orderBy = params.searchRanking;
      const newsSource = params.searchSocuce;
      const newsGroup = params.searchNewsGroup;
      const contentType = params.contentType;
      // 读缓存每页条数
      const size = sizeType(params.searchSize,this.props);
    dispatch({
      type: 'newsList/query',
      payload: {
        index,
        title,
        newsId,
        newsType,
        newsState,
        size,
        beginDay,
        endDay,
        newsSource,
        orderBy,
        newsGroup,
        contentType,
      },
    });
  }

  // 选择表格中的行数据
  handleSelectRows = (rows) => {
    this.setState({
      selectedRows: rows,
    });
  }

  // 表格切换页数
  handleStandardTableChange = (pagination, filtersArg, sorter) => {
    const { dispatch } = this.props;
    const { formValues } = this.state;

    const filters = Object.keys(filtersArg).reduce((obj, key) => {
      const newObj = { ...obj };
      newObj[key] = getValue(filtersArg[key]);
      return newObj;
    }, {});

    const params = {
      currentPage: pagination.current,
      pageSize: pagination.pageSize,
      ...formValues,
      ...filters,
    };
    if (sorter.field) {
      params.sorter = `${sorter.field}_${sorter.order}`;
    }

    dispatch({
      type: 'jobList/fetch',
      payload: params,
    });
  }

  // 审核结果
  handleCheckResult = (row) =>{
    const path = `/news/check-result/${row.newsId}`;
    localStorage.setItem('searchData',JSON.stringify(this.state));
    this.props.history.push(path);
  }

  // 表格相关操作
  handleTableOperation = (row) => {
    let text = '置顶';
    if(row.newsHot>0){
      text = '取消置顶';
    }
    return (
      <div>
        <a className="ant-dropdown-link" onClick={this.handleTableSeeClick.bind(this,row)}>审核</a>
        <a style={{marginLeft:10}} onClick={this.handleFastPass.bind(this,row)}>快速审核</a>
        <a style={{marginLeft:10}} onClick={this.handleNewsTop.bind(this,row)}>{text}</a>
        <a style={{marginLeft:10}} onClick={this.handleCheckResult.bind(this,row)}>审核结果</a>
      </div>
    );
  }

  // 处理 table 查看点击，视频、新闻、问答、段子会有不同的预留
  // - 现在支持 新闻预留
  // 新闻审核按钮功能
  handleTableSeeClick = (row) => {
    const newsType = row.newsType;
    const newsGroup = row.newsGroup;
    const contentType = row.contentType;
    let path = '';

    localStorage.setItem('searchData',JSON.stringify(this.state));
    localStorage.setItem('newsType',newsType);
    localStorage.setItem('contentType',contentType);
    if(newsGroup != 5 && (contentType == 0 || contentType == 2 || contentType == 3)){//图文
      path = `/news/news-content-edit/${row.newsId}`;
    }else{ //问答、视频、多图
      path = `/news/news-content-view/${row.newsId}`;
   }
     
   this.props.history.push(path);

  }
    // 快速审核
    handleFastPass = (row) => {
      const { dispatch } = this.props;
      const { newsId } = row;
      dispatch({
        type:'newsList/modifyNewsState',
        payload:{
          newsId,
          newsState: 8,
          newsGroup: -1,
          searchBeginDay: null,
          searchContentType: -1,
          searchEndDay: null,
          searchNewsGroup: -1,
          searchNewsSource: "",
          searchNewsState: -1,
          searchOrderBy: "",
          searchTitle: "",
        },
        callback:(res)=>{
          if(res.code == 0){
            message.success('操作成功');
            this.queryNewsList();
          }else{
            message.error(res.message);
          }
        }
      });
    }
  // 新闻置顶、取消置顶
  handleNewsTop = (row) => {
    const {newsTop} = this.state;
    const { newsId, newsHot } = row;
    newsTop.startTime = null;
    newsTop.endTime = null;
    let title;
     // 未审核数据提示审核
     if(row.newsState != 0 && row.newsState != 4 && newsHot==0){
      const _this = this;
      confirm({
        title: '未通过审核，是否需要发布',
        okText:'确定',
        cancelText:'取消',
        onOk(){
          let path = '';
          const { newsType, contentType } = row;
          if (newsType != 5 && (contentType === 0 || contentType === 2 || contentType === 3)) {
            path = `/news/news-content-edit/${row.newsId}`;
          } else {
            path = `/news/news-content-view/${row.newsId}`;
          }
        
          localStorage.setItem('searchData',JSON.stringify(_this.state));
          _this.props.history.push(path);
        },
      });
      return;
    }
    this.props.form.resetFields(['setTopTime']);
    if(newsHot>0){
      title = '取消置顶';
    }else{
      title = '置顶';
    }
    this.setState({
      newsTop:{
        ...newsTop,
        newsId,
        newsHot,
        title,
        visible:true,
      },
      
    }); 
    
  }
  // 弹框内容
  newsToptips = () => {
    const { getFieldDecorator } = this.props.form;
    const  {newsTop:{newsHot}} = this.state;
    const setTopTime = null;
    const newsTopType = 0;
    if( newsHot > 0 ){
      return <p>是否取消置顶？</p>
    }else{
      return (
        <div className={styles.set_time}>
        <Form onSubmit={this.handleOk}>
            <FormItem
            label="置顶时间"
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 12 }}
            >
              {getFieldDecorator('setTopTime', { 
                initialValue: setTopTime, 
                rules: [{ type: 'array', required: true, message: '请选择置顶时间' }],
              })(
                <RangePicker format='YYYY-MM-DD HH:mm' showTime={{ format: 'HH:mm' }}/>
              )}
            </FormItem>
          
            <FormItem
              label='新闻类型'
              labelCol={{ span: 5 }}
              wrapperCol={{ span: 6 }}
            >
              {getFieldDecorator('newsTopType', { 
                initialValue: newsTopType, 
              })(
                <NewsType onChange={this.handleTopType} type='1'/>
              )}
            </FormItem>
        </Form>
        </div>
      )
    }
  }
  // 确定、取消置顶
  handleOk = () => {
    const { dispatch,form:{validateFields} } = this.props;
    const { newsTop} = this.state;
    const { newsId, newsHot } = newsTop;
    const _this = this;
    validateFields((err, values) => {

      if (err && newsHot==0) return;
      const { setTopTime, newsTopType } = values;
   
      const formatTime = 'YYYY-MM-DD HH:mm:ss';
      if(newsHot>0){
        dispatch({
          type:'newsList/newsCancelTop',
          payload:{
            newsId,
            versionType:0,
          },
          callback:(res)=>{
            if(res.code == 0){
              _this.handleHide();
              _this.queryNewsList();
            }
          }
        })
      }else{
        dispatch({
          type:'newsList/newsTop',
          payload:{
            newsId,
            newsType:newsTopType,
            startTime:moment(setTopTime[0]).format(formatTime),
            endTime:moment(setTopTime[1]).format(formatTime),
            versionType:0,
          },
          callback:(res)=>{
            if(res.code == 0){
              _this.handleHide();
              _this.queryNewsList();
            }else{
              message.error(res.message);
            }
          }
        })
      }  
    })
  }
  // 取消弹框
  handleHide = () => {
   const {newsTop} = this.state;
   newsTop.startTime = null;
   newsTop.endTime = null;
    this.setState({
      newsTop:{
        ...newsTop,
        visible:false,
        bool:false,
      }
    });
  }
  
  // 查询
  handleSearch = (e,arg) => {
    if (e) {
      e.preventDefault();
    }
    const { dispatch, form } = this.props;
   
    form.validateFields((err, fieldsValue) => {
    
      const values = {
        ...fieldsValue,
        updatedAt: fieldsValue.updatedAt && fieldsValue.updatedAt.valueOf(),
      };
      this.setState({
        formValues: values,
      });
      let beginDay = null;
      let endDay = null;
      
      beginDay = values.beginDay ? moment(values.beginDay).format('YYYY-MM-DD') : null;
      endDay =  values.endDay ? moment(values.endDay).format('YYYY-MM-DD') : null;
      
      if(arg){
          if(typeof arg === 'string'){
            endDay = moment(+new Date()).subtract(0,'days').format('YYYY-MM-DD');;
            beginDay = arg;
          }
      }
      const { title, newsId, newsType, orderBy, newsSource, contentType, searchNewsState } = values;
      const index = 0;
      let newsState = searchNewsState;
      this.state.searchIndex = index;
      this.state.searchId = newsId;
      this.state.searchTitle = title;
      this.state.searchNewsType = newsType;
      this.state.searchRanking = orderBy;
      this.state.searchSocuce = newsSource;
      this.state.contentType = contentType;
      this.state.searchBeginDay = beginDay;
      this.state.searchEndDay = endDay;
      this.state.searchNewsState = searchNewsState;
      dispatch({
        type: 'newsList/query',
        payload: {
          index,
          title,
          newsId,
          newsType,
          newsState,
          orderBy,
          newsSource,
          size: this.state.searchSize,
          beginDay,
          endDay,
          newsState:this.state.searchNewsState,
          newsGroup: this.state.searchNewsGroup,
          contentType:this.state.contentType,
        },
      });
    });
  }

  // 表格分页
  handleTableChange = (pagination, filters, sorter) => {
    
    const { dispatch } = this.props;
    const { current, pageSize } = pagination;
    const title = this.state.searchTitle;
    const newsId = this.state.searchId;
    const newsType = this.state.searchNewsType;
    const newsState = this.state.searchNewsState;
    const index = (current - 1);
    this.state.searchIndex = index;
    this.state.searchSize = pageSize;
    sizeChange(pageSize, this.props);
    dispatch({
      type: 'newsList/query',
      payload: {
        index,
        size: pageSize,
        title,
        newsId,
        newsType,
        newsState,
        beginDay: this.state.searchBeginDay,
        endDay: this.state.searchEndDay,
        newsGroup: this.state.searchNewsGroup,
        newsSource:this.state.searchSocuce,
        orderBy: this.state.searchRanking,
        contentType:this.state.contentType,
      },
    });
  };

  // 重置搜索条件
  handleFormReset = () => {
    const { form, dispatch } = this.props;
    form.resetFields();
    
    const params = {
      formValues: {},
      searchTitle:'',
      searchId:'',
      searchBeginDay:null,
      searchEndDay:null,
      searchNewsGroup:this.state.searchNewsGroup,
      searchNewsType:-1,
      searchRanking:'',
      searchSocuce:'',
      searchNewsState:-1,
      contentType:-1,
      searchIndex: 0,
    };
    this.setState(params);
    this.queryNewsList(params);
  }

  handleModalModify = (newValues, oldValue) => {
    // 修改需要注意：后台有 两属性不一致.
    this.props.dispatch({
      type: 'jobList/modify',
      payload: {
        body: {
          ...newValues,
          schedulerId: oldValue.id,
          triggerExpression: newValues.triggerValue,
        },
      },
      callback: () => {
        // query list
        this.queryNewsList();
      },
    });
    this.setState({
      modalVisible: false,
    });
  }

  // modal 操作
  handleModalAdd = (newValues) => {
    this.props.dispatch({
      type: 'newsList/save',
      payload: {
        body: {
          ...newValues,
          triggerExpression: newValues.triggerValue,
        },
      },
      callback: () => {
        // query list
        this.queryNewsList();
      },
    });
    this.setState({
      modalVisible: false,
    });
  }

  handleModalVisible = (flag) => {
    this.setState({
      modalVisible: !!flag,
    });
  }

   // 历史时间搜索
  handleAgoDay(day){
    const date = moment(+new Date()).subtract(day,'days').format('YYYY-MM-DD');
    this.props.form.resetFields(['beginDay','endDay']);
    this.handleSearch('',date);
  }
  // 刷新查询
  handleRefresh(nun){
    this.handleSearch('',nun);
  }

  // 选择分组
  handleChange = (e) => {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({'newsGroup':e})

  }
    //开始日期限制
   disabledStartDate = (startValue) => {
      const endValue = this.state.searchEndDay;
      if (!startValue || !endValue) {
        return false;
      }
      return startValue.valueOf() >= endValue.valueOf();
    }
    // 结束日期限制
    disabledEndDate = (endValue) => {
      const startValue = this.state.searchBeginDay;
      if (!endValue || !startValue) {
        return false;
      }
      return endValue.valueOf() <= startValue.valueOf();
    }
  
    onChange = (field, value) => {
      this.setState({
        [field]: value,
      });
    }
  
    onStartChange = (value) => {
      this.onChange('searchBeginDay', value);
    }
  
    onEndChange = (value) => {
      this.onChange('searchEndDay', value);
    }

  // 查询dom
  renderSimpleForm() {
    const { getFieldDecorator } = this.props.form;
    const { query } = this.props.location;
    
    if (query !== undefined) {
      this.state.searchIndex = query.index;
      this.state.searchTitle = query.title;
      this.state.searchNewsState = query.newsState;
      this.state.searchNewsType = query.newsType;
      this.state.searchSize = query.size;
      this.state.searchNewsGroup = query.newsGroup;
      this.state.searchBeginDay = query.beginDay;
      this.state.searchEndDay = query.endDay;
      this.props.location.query = undefined;
    }
    
    return (
      <Form onSubmit={this.handleSearch} layout="inline">
          <dl className={styles.searchLayout}>
              <dd style={{width:'300px'}}>
                <FormItem label="标题">
                  {getFieldDecorator('title', { initialValue: this.state.searchTitle })(
                    <Input placeholder="请输入" />
                  )}
                </FormItem>
              </dd>
              <dd style={{width:'260px'}}>
                <FormItem label="新闻ID">
                  {getFieldDecorator('newsId', { initialValue: this.state.searchId })(
                    <Input placeholder="请输入" />
                  )}
                </FormItem>
              </dd>
              <dd>
                <FormItem
                  labelCol={{ span: 2 }}
                  wrapperCol={{ span: 2 }}
                  label="排序"
                >
                  {getFieldDecorator('orderBy', { initialValue: this.state.searchRanking })(
                    <Select style={{ width: '100%' }}>
                      <Option value={0}>热度排序</Option>
                      <Option value={''}>时间排序</Option>
                      <Option value={1}>综合排序</Option>
                    </Select>
                  )}
                </FormItem>
              </dd>
              <dd>
                <FormItem
                  labelCol={{ span: 2 }}
                  wrapperCol={{ span: 2 }}
                  label="来源"
                >
                  {getFieldDecorator('newsSource', { initialValue: this.state.searchSocuce })(
                    <Select style={{ width: '100%' }}>
                      <Option value={''}>全部来源</Option>
                      <Option value={'西瓜视频'}>西瓜视频</Option>
                      <Option value={'悟空问答'}>悟空问答</Option>
                      <Option value={'糗事百科'}>糗事百科</Option>
                      <Option value={'新浪新闻'}>新浪新闻</Option>
                      <Option value={'凤凰新闻'}>凤凰新闻</Option>
                      <Option value={'网易新闻'}>网易新闻</Option>
                      <Option value={'搜狐新闻'}>搜狐新闻</Option>
                      <Option value={'凤凰科技'}>凤凰科技</Option>
                      <Option value={'澎湃新闻'}>澎湃新闻</Option>
                      <Option value={'环球网'}>环球网</Option>
                      <Option value={'新浪体育'}>新浪体育</Option>
                    </Select>
                  )}
                </FormItem>
              </dd>
              <dd style={{width:'210px'}}>
                <FormItem
                  labelCol={{ span: 2 }}
                  wrapperCol={{ span: 2 }}
                  label="内容类型"
                >
                  {getFieldDecorator('contentType', { initialValue: this.state.contentType })(
                    <Select>
                      <Option value={-1}>全部</Option>
                      <Option value={0}>图文</Option>
                      <Option value={1}>多图</Option>
                      <Option value={2}>视频</Option>
                    </Select>
                  )}
                  </FormItem>
              </dd>
              <dd style={{width:'210px'}}>
                <FormItem
                  labelCol={{ span: 2 }}
                  wrapperCol={{ span: 2 }}
                  label="状态"
                >
                  {getFieldDecorator('searchNewsState', { initialValue: this.state.searchNewsState })(
                    <Select>
                      <Option value={-1}>全部</Option>
                      <Option value={0}>正常</Option>
                      <Option value={1}>删除</Option>
                      <Option value={2}>待发布</Option>
                      <Option value={3}>审核不通过</Option>
                      <Option value={4}>机器审核</Option>
                    </Select>
                  )}
                  </FormItem>
              </dd>
             
              <dd style={{width:'220px'}}>
                <FormItem label="开始日期">
                  {getFieldDecorator('beginDay', { initialValue:this.state.searchBeginDay && moment(this.state.searchBeginDay, 'YYYY-MM-DD') })(
                    <DatePicker className="left-padding" style={{width:'100%'}} 
                      disabledDate={this.disabledStartDate}
                      onChange={this.onStartChange}
                    />
                  )}
                </FormItem>
              </dd>
              <dd style={{width:'220px'}}>
                <FormItem label="结束日期">
                  {getFieldDecorator('endDay', { initialValue: this.state.searchEndDay&&moment(this.state.searchEndDay, 'YYYY-MM-DD') })(
                    <DatePicker className="left-padding" style={{width:'100%'}} 
                      disabledDate={this.disabledEndDate}
                      onChange={this.onEndChange}
                    />
                  )}
                </FormItem>
              </dd>
              <dd style={{width:'150px'}}>
                <span className={styles.submitButtons}>
                  <Button type="primary" htmlType="submit">查询</Button>
                  <Button style={{ marginLeft: 8 }} onClick={this.handleFormReset}>重置</Button>
                </span>
              </dd>
              <dd className={styles.ago}>
                <a href="javascript:void(0)" onClick={this.handleAgoDay.bind(this,0)}>今天</a>
                <a href="javascript:void(0)" onClick={this.handleAgoDay.bind(this,7)}>7天</a>
                <a href="javascript:void(0)" onClick={this.handleAgoDay.bind(this,14)}>14天</a>
                <a href="javascript:void(0)" onClick={this.handleAgoDay.bind(this,30)}>30天</a>
              </dd>
              <dd className={styles.refresh}>
                <a href="javascript:void(0)" onClick={this.handleRefresh.bind(this,-1)}>刷新</a>
              </dd>
          </dl>
      </Form>
    );
  }

  renderForm() {
    return this.renderSimpleForm();
  }
  //添加待待关注、
  addStayAttention = () => {
    
    const _this = this;
    const { dispatch } = this.props;
    const { selectedRows } = this.state;
    const dataLen = selectedRows.length;
    const attrList = [];
    
    // 提示存在关注
    if(dataLen){
      for(let i=0;i<dataLen;i++){
        if(selectedRows[i].attention == 1){
          message.info('选择数据存在已设关注');
          return;
        }
      }
    }else{
      message.info('请选择数据');
      return;
    }
    confirm({
      title: '确定添加到关注标记列表?',
      okText:'确定',
      cancelText:'取消',
      onOk() {
            // 准备提交的数据
            for(let i=0;i<dataLen;i++){
              let item = selectedRows[i];
              let obj = {
                attentionId:null,
                newsId:item.newsId,
                title:item.title,
                eventTime:moment(item.addTime).format('YYYY-MM-DD HH:mm:ss'),
                newsAbstract:item.newsAbstract,
                newsType:item.newsType,
                contentType:item.contentType,
              };
              attrList.push(obj);
          }
            // 防止多次提交
            if(_this.submitAgain){
              return;
            }
            _this.submitAgain = true;
            dispatch({
              type:'newsList/addStayAttention',
              payload:{
                attrList,
              },
              callback:(res)=>{
                setTimeout(()=>{
                  _this.submitAgain = false;
                },300);
                if(res.code == 0){
                  message.success('添加数据成功');
                  this.setState({
                    selectedRows:[],
                  });
                }else{
                  message.error(res.message);
                }
              }
            });
      },
      onCancel() {
      
      },
    });
  
  } 

  // 切换选项卡
  changeTab = (e) => {
    const { newsList:{ tabMenu } } = this.props;
    let newsType;
    for(let i=0;i<tabMenu.length;i++){
      if(tabMenu[i].id == e){
        newsType = tabMenu[i].newsType;
        break;
      }
    }
    const { form } = this.props;
    form.resetFields();
    const params = {
      formValues: {},
      searchTitle:'',
      searchId:'',
      searchBeginDay:null,
      searchEndDay:null,
      searchNewsGroup:newsType,
      searchNewsType:-1,
      searchRanking:'',
      searchSocuce:'',
      searchNewsState:-1,
      contentType:-1,
      searchIndex: 0,
      tabId:e,
    };
    this.setState(params);
    this.queryNewsList(params);
  }
  
  render() {
    const { newsList,match } = this.props;
    const {  selectedRows, modalVisible, modalTitle, modalType, tabId } = this.state;
    const { newsModifyData, newsAddData } = this.state;
    const _this = this;
    const {params:{type}} = match;
   
    return (  
      <PageHeaderLayout>
        <Card bordered={false}>
          <Tabs animated={false} activeKey={tabId} onChange={this.changeTab}>
           
            {
              newsList['tabMenu'].map( item => {
                return (
                  <TabPane tab={item.name} key={item.id}>
                    <div className={styles.tableList}>
                    <div className={styles.tableListForm}>
                      {_this.renderForm()}
                    </div>
                    <NewsTable
                      selectedRows={selectedRows}
                      loading={newsList.loading}
                      data={newsList.data}
                      state={_this.state}
                      history = {_this.props.history}
                      onSelectRow={_this.handleSelectRows}
                      onChange={_this.handleStandardTableChange}
                      operation={_this.handleTableOperation}
                      onTableChange={_this.handleTableChange}
                      query={_this.state}
                      pageType={type}
                      addStayAttention={this.addStayAttention}
                    />
                  </div>
                </TabPane>
                );
              })
            }
           
          </Tabs>
        </Card>
            
        <NewsModal
          title={modalTitle}
          modalVisible={modalVisible}
          handleOK={modalType === MODAL_TYPE.ADD ? this.handleModalAdd : this.handleModalModify}
          handleCancel={() => this.handleModalVisible()}
          newsData={modalType === MODAL_TYPE.ADD ? newsAddData : newsModifyData}
        />
        <Modal
          title={this.state.newsTop.title}
          visible={this.state.newsTop.visible}
          destroyOnClose={true}
          maskClosable={false}
          onOk={this.handleOk}
          onCancel={this.handleHide}
          className={styles.hightData}
        >
         {this.newsToptips()||null}
        </Modal>
      </PageHeaderLayout>
    );
  }
}
