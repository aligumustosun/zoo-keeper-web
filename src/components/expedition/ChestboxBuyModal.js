import { useState, useEffect } from 'react';
import styles from './ChestboxBuyModal.less';
import OpenChestboxModal from './OpenChestboxModal';
import '../../../node_modules/animate.css/animate.min.css';
import React, { useContext } from 'react';
import { WalletContext } from '../../wallet/Wallet';
import { NFT_FACTORY_ADDRESS, ZOO_TOKEN_ADDRESS } from '../../config';
import { approveExpedition, buyGoldenChest, buySilverChest, checkApproveExpedition, deposit, withdraw } from '../../wallet/send';
import BigNumber from 'bignumber.js';
import { commafy, openNotificationOpenedBox, openNotificationExclamation } from '../../utils';
import { getNftInfo } from '../../hooks/nftInfo';
import { insertHistory } from '../../utils/db';
import { useLanguage } from '../../hooks/language';


export default function ChestboxBuyModal(props) {
  // Open Confirm Modal //
  const closeModal = () => {
    props.setModal(0);
  }
  const [modal, setModal] = useState(0);
  const [tokenId, setTokenId] = useState('0');
  const [level, setLevel] = useState('0');
  const [category, setCategory] = useState('0');
  const [item, setItem] = useState('0');
  const [name, setName] = useState('0');
  const [icon, setIcon] = useState('');
  const [meta, setMeta] = useState('');
  const [boost, setBoost] = useState(0);
  const [reduce, setReduce] = useState(0);
  const [itemSupply, setItemSupply] = useState(1);

  const wallet = useContext(WalletContext);
  const chainId = wallet.networkId;
  const connected = wallet.connected;
  const address = wallet.address;
  const web3 = wallet.web3;
  const [approved, setApproved] = useState(false);
  const [updateApprove, setUpdateApprove] = useState(0);
  const setTxWaiting = props.setTxWaiting;
  const type = props.type;
  const price = props.price;
  const zooBalance = new BigNumber(props.zooBalance);
  const t = useLanguage();

  // console.debug('price:', price, zooBalance);
  useEffect(()=>{
    if (!chainId || !address || !connected || !web3) {
      return;
    }
    // console.debug('checkApproveExpedition begin', updateApprove);
    checkApproveExpedition(ZOO_TOKEN_ADDRESS[chainId], '0x'+(new BigNumber(price)).multipliedBy(1e18).toString(16), chainId, web3, address).then(ret=>{
      // console.debug('checkApproveExpedition', ret);
      setApproved(ret);
    }).catch(err=>{
      console.error('checkApproveExpedition err', err);
    });
  }, [chainId, address, connected, price, web3, updateApprove]);


  return (
    <React.Fragment>
    <OpenChestboxModal isActived={modal} 
      setModal={setModal} type={type} 
      icon={icon} level={level} name={name} 
      boost={boost} reduce={reduce} 
      rare={item}
      itemSupply={itemSupply}
      category={category} tokenId={tokenId}></OpenChestboxModal>
    <div className={`modal  ${props.isActived === 0 ? "" : "is-active"}`}>
      <div className="modal-background" onClick={closeModal}></div>
      <div style={{ maxWidth: 400 }} className="modal-card animate__animated  animate__fadeInUp animate__faster">
        <section className="modal-card-body">
          <a onClick={closeModal} className="close"><img src="assets/remove16x16.png" /></a>
          <div className={styles.description}>
            {
              props.type === 'golden' && <img src="assets/goldenbox48x48.png" /> 
            }
            {
              props.type === 'silver' && <img src="assets/silverbox48x48.png" /> 
            }
            
            <div>
              <div>{props.title}</div>
              <div>{t("ZOO TO BURN")}: <span>{commafy(price)}</span></div>
            </div>
          </div>
          <div className={styles.rule}>
            <div>{t("RULES")}</div>
            <span>{props.rules}</span>
            <a href="https://docs.zookeeper.finance/manual/expedition#dynamic-pricing-mechanics" target="_blank">{t("MORE DETAILS ABOUT THE CHEST")}</a>
          </div>
          <div className={styles.action}>
            <a className={styles.action_btn} disabled={approved} onClick={()=>{
              setTxWaiting(true);
              approveExpedition(ZOO_TOKEN_ADDRESS[chainId], chainId, web3, address).then(ret=>{
                setTxWaiting(false);
                setUpdateApprove(updateApprove + 1);
                // console.debug('approve bt ret', ret);
              }).catch(err=>{
                setTxWaiting(false);
                console.error('approve failed', err);
              });
            }} > {/* Can remove 1 button and it will expand 100% automatically*/}
              {t("Approve")}
            </a>
            <a className={styles.action_btn} style={{display:'none'}}>
              {t("Validate")}
            </a>
          </div>
          <div className={styles.action}>
          <a className={styles.action_btn} disabled={!approved}  onClick={()=>{
            if (!zooBalance.gte(price)) {
              openNotificationExclamation("Zoo balance not enough");
              closeModal();
              return;
            }

            setTxWaiting(true);
            if (type === 'silver') {
              buySilverChest(web3, chainId, address).then(ret=>{
                if (ret.events.MintNFT.returnValues.level === '0') {
                  // console.debug('33333', ret);
                  closeModal();
                  openNotificationOpenedBox(t(type.toUpperCase()+' CHEST HAS BEEN OPENED'),t('You got'),t('Check your Safe'), t('Nothing...'), t('Unfortunately you get nothing this time around; after 9 unsuccessful tries you are guaranteed a random NFT upon opening the 10th silver chest in a row.'), 'assets/sliversmoke.png', true);
                } else {
                  getNftInfo(ret.events.MintNFT.returnValues.tokenId, web3, chainId).then(obj=>{
                    // console.debug('nftmeta111', obj);
                    insertHistory('chest', Date.now(), ret.events.MintNFT.returnValues.tokenId, obj.name, obj.image, ret.events.MintNFT.returnValues.level, commafy(price), 'ZOO', ret.transactionHash);

                    setTokenId(ret.events.MintNFT.returnValues.tokenId);
                    setLevel(ret.events.MintNFT.returnValues.level);
                    setCategory(ret.events.MintNFT.returnValues.category);
                    setItem(ret.events.MintNFT.returnValues.item);
                    setItemSupply(ret.events.MintNFT.returnValues.itemSupply);
                    setIcon(obj.image);
                    setName(obj.name);
                    setBoost(obj.boost);
                    setReduce(obj.timeReduce);
                    closeModal();
                    setModal(1);
                    openNotificationOpenedBox(t(type.toUpperCase()+' CHEST HAS BEEN OPENED'),t('You got'),t('Check your Safe'), obj.name, t('Your boost card has been transfered to your safe.'), obj.image, false, false);
                  }).catch(err=>{
                    console.error('getNftInfo error', err);
                  });
                }
                setTxWaiting(false);
              }).catch(err=>{
                console.error('buySilverChest error', err);
                setTxWaiting(false);
              });
            } else {
              buyGoldenChest(web3, chainId, address).then(ret=>{
                getNftInfo(ret.events.MintNFT.returnValues.tokenId, web3, chainId).then(obj=>{
                  insertHistory('chest', Date.now(), ret.events.MintNFT.returnValues.tokenId, obj.name, obj.image, ret.events.MintNFT.returnValues.level, commafy((new BigNumber(ret.events.GoldenBuy.returnValues.price)).div(1e18)), 'ZOO', ret.transactionHash);

                  setTokenId(ret.events.MintNFT.returnValues.tokenId);
                  setLevel(ret.events.MintNFT.returnValues.level);
                  setCategory(ret.events.MintNFT.returnValues.category);
                  setItem(ret.events.MintNFT.returnValues.item);
                  setItemSupply(ret.events.MintNFT.returnValues.itemSupply);
                  setIcon(obj.image);
                  setName(obj.name);
                  setBoost(obj.boost);
                  setReduce(obj.timeReduce);
                  closeModal();
                  setModal(1);
                  openNotificationOpenedBox(t(type.toUpperCase()+' CHEST HAS BEEN OPENED'),t('You got'),t('Check your Safe'), obj.name, t('Your boost card has been transfered to your safe.'), obj.image, false, true);
                }).catch(err=>{
                  console.error('getNftInfo error', err);
                });
                setTxWaiting(false);
              }).catch(err=>{
                console.error('buyGoldenChest error', err);
                setTxWaiting(false);
              });
            }
          }}>
                {t("Buy & Open Chest")}
          </a>
          </div>
        </section>
      </div>



    </div>
    </React.Fragment>
  )
}
